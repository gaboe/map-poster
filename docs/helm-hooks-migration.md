# Helm Hooks Migration: Pre/Post-Deployment to Web App Chart

## Overview

This document outlines the migration of standalone `pre-deployment` and `post-deployment` Helm charts into native Helm hooks within the `web-app` chart.

## Current Architecture

### Pre-Deployment Chart

- **Purpose**: Database migrations before web app deployment
- **Type**: Standalone Helm chart with Kubernetes Job
- **Location**: `kubernetes/helm/pre-deployment/`
- **Deployment**: Separate Azure DevOps pipeline stage
- **Dependencies**: `DATABASE_URL` secret

### Post-Deployment Chart

- **Purpose**: Synchronization tasks after web app deployment
- **Type**: Standalone Helm chart with Kubernetes Job
- **Location**: `kubernetes/helm/post-deployment/`
- **Deployment**: Separate Azure DevOps pipeline stage
- **Dependencies**: `DATABASE_URL`, `INTERNAL_BASE_URL` (pointing to web-app service)

### Issues with Current Approach

1. Three separate Helm releases to manage
2. Manual ordering in Azure DevOps pipeline (3 stages per environment)
3. No atomic rollback capability
4. Duplicate configuration across charts
5. Increased maintenance overhead
6. Separate secret management for each component

## Proposed Architecture

### Helm Hooks in Web App Chart

Both jobs will be integrated as Helm hooks in `kubernetes/helm/web-app/`:

```
kubernetes/helm/web-app/
├── templates/
│   ├── pre-install-migration-job.yaml  (new)
│   ├── post-install-sync-job.yaml      (new)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── ...
├── values.yaml
├── values.test.yaml
└── values.prod.yaml
```

### Hook Execution Flow

```
1. helm upgrade web-app --wait --timeout 3m ...
2. → pre-install hook (weight: -5) - Database migrations
3. → Install/upgrade main web-app deployment
4. → Wait for web-app pods to be ready (enforced by --wait flag)
5. → post-install hook (weight: 5) - Synchronization
6. → Release marked as successful
```

### CI/CD Integration: The `--wait` Flag

The `HelmDeploy` task in Azure DevOps uses `--wait --timeout 3m` flag:

```yaml
- task: HelmDeploy@1
  inputs:
    command: "upgrade"
    arguments: "--wait --timeout 3m"
```

**Why is this required?**

Without `--wait`, Helm would:

1. Apply manifests (create/update Deployment, Service, etc.)
2. Immediately run post-install hooks
3. Finish - without waiting for pods to be ready

This causes a **race condition**: the post-deployment job (which calls web-app API endpoints like `/api/auth/sign-up/email`) would run before the new pods are ready, potentially hitting old pods or failing entirely.

With `--wait`:

1. Helm applies manifests
2. Helm waits until all pods are READY (passing readiness probes)
3. Only then runs post-install hooks
4. Post-deployment job safely calls the new web-app version

**Timeout:** 3 minutes should be sufficient for web-app startup. If deployment consistently times out, investigate pod startup issues.

## Implementation Details

### Step 1: Create Pre-Install Hook Template

**File**: `kubernetes/helm/web-app/templates/pre-install-migration-job.yaml`

```yaml
{{- if .Values.hooks.preInstall.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "map-poster-web-app.fullname" . }}-pre-install-migration
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "map-poster-web-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: migration
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: {{ .Values.hooks.preInstall.backoffLimit }}
  activeDeadlineSeconds: {{ .Values.hooks.preInstall.activeDeadlineSeconds }}
  template:
    metadata:
      labels:
        {{- include "map-poster-web-app.labels" . | nindent 8 }}
        app.kubernetes.io/component: migration
    spec:
      restartPolicy: Never
      securityContext:
        fsGroup: 1000
      containers:
        - name: migration
          image: "{{ .Values.hooks.preInstall.image.repository }}:{{ .Values.hooks.preInstall.image.tag | default .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.hooks.secretName }}
                  key: DATABASE_URL
          resources:
            {{- toYaml .Values.hooks.preInstall.resources | nindent 12 }}
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end }}
```

### Step 2: Create Post-Install Hook Template

**File**: `kubernetes/helm/web-app/templates/post-install-sync-job.yaml`

```yaml
{{- if .Values.hooks.postInstall.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "map-poster-web-app.fullname" . }}-post-install-sync
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "map-poster-web-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: sync
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: {{ .Values.hooks.postInstall.backoffLimit }}
  activeDeadlineSeconds: {{ .Values.hooks.postInstall.activeDeadlineSeconds }}
  template:
    metadata:
      labels:
        {{- include "map-poster-web-app.labels" . | nindent 8 }}
        app.kubernetes.io/component: sync
    spec:
      restartPolicy: Never
      securityContext:
        fsGroup: 1000
      containers:
        - name: sync
          image: "{{ .Values.hooks.postInstall.image.repository }}:{{ .Values.hooks.postInstall.image.tag | default .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.hooks.secretName }}
                  key: DATABASE_URL
            - name: NODE_ENV
              value: {{ .Values.hooks.postInstall.nodeEnv | default "production" | quote }}
            - name: INTERNAL_BASE_URL
              value: "http://{{ include "map-poster-web-app.fullname" . }}.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.service.port }}"
          resources:
            {{- toYaml .Values.hooks.postInstall.resources | nindent 12 }}
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end }}
```

### Step 3: Update Web App Chart Values

**Add to**: `kubernetes/helm/web-app/values.test.yaml` and `kubernetes/helm/web-app/values.prod.yaml`

```yaml
hooks:
  secretName: web-app-secrets
  preInstall:
    enabled: true
    image:
      repository: blogicapps2-fgbjaff4hhdzcga7.azurecr.io/map-poster/pre-deployment
      tag: ""
    backoffLimit: 1
    activeDeadlineSeconds: 900
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"
      requests:
        cpu: "200m"
        memory: "256Mi"

  postInstall:
    enabled: true
    image:
      repository: blogicapps2-fgbjaff4hhdzcga7.azurecr.io/map-poster/post-deployment
      tag: ""
    backoffLimit: 1
    activeDeadlineSeconds: 900
    nodeEnv: "production"
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"
      requests:
        cpu: "200m"
        memory: "256Mi"
```

### Step 4: Update Azure DevOps Pipeline

#### Simplify Deploy Environment Stage

**Update**: `azp/stages/deploy-environment.yml`

Remove the separate PreDeployment and PostDeployment stages. The single WebAppDeployment stage handles everything via Helm hooks.

```yaml
parameters:
  - name: environment
    type: string
  - name: dependsOn
    type: object
    default: []
  - name: condition
    type: string
  - name: namespace
    type: string
  - name: tag
    type: string
  - name: variableGroup
    type: string
  - name: serviceConnection
    type: string
  - name: imageRepository
    type: string
  - name: deploymentTarget
    type: string
    values:
      - azure
      - cloudfleet

stages:
  - stage: Deploy_${{ upper(parameters.environment) }}
    displayName: "[${{ upper(parameters.environment) }}] Deploy Web App"
    dependsOn: ${{ parameters.dependsOn }}
    condition: ${{ parameters.condition }}
    variables:
      - group: ${{ parameters.variableGroup }}
      - name: targetNamespace
        value: ${{ parameters.namespace }}
    jobs:
      - template: ../jobs/web-app-deployment.yml
        parameters:
          environment: ${{ parameters.environment }}
          serviceConnection: ${{ parameters.serviceConnection }}
          namespace: ${{ parameters.namespace }}
          tag: ${{ parameters.tag }}
          imageRepository: ${{ parameters.imageRepository }}-web-app
          deploymentTarget: ${{ parameters.deploymentTarget }}
```

#### Update Web App Deployment Job

**Update**: `azp/jobs/web-app-deployment.yml`

The `web-app-secrets` secret already contains `DATABASE_URL`, which is used by the hooks. No additional secret creation needed since hooks reference the same secret.

Add helm override for hook image tags:

```yaml
- name: helmOverrides
  ${{ if eq(parameters.deploymentTarget, 'cloudfleet') }}:
    value: |
      image.tag=${{ parameters.tag }}
      hooks.preInstall.image.tag=${{ parameters.tag }}
      hooks.postInstall.image.tag=${{ parameters.tag }}
      imagePullSecrets[0].name=acr-secret
  ${{ else }}:
    value: |
      image.tag=${{ parameters.tag }}
      hooks.preInstall.image.tag=${{ parameters.tag }}
      hooks.postInstall.image.tag=${{ parameters.tag }}
```

### Step 5: Cleanup After Migration

**Delete directories**:

- `kubernetes/helm/pre-deployment/`
- `kubernetes/helm/post-deployment/`

**Delete Azure DevOps job templates**:

- `azp/jobs/pre-deployment.yml`
- `azp/jobs/post-deployment.yml`

**Note**: Keep the Docker image builds in `azure-pipelines.yml` as the hook Jobs still use these images.

## Helm Hook Annotations Explained

### `helm.sh/hook`

- **`pre-install`**: Runs before main resources are installed (new deployment)
- **`pre-upgrade`**: Runs before main resources are upgraded (existing deployment)
- **`post-install`**: Runs after main resources are installed
- **`post-upgrade`**: Runs after main resources are upgraded

### `helm.sh/hook-weight`

- Controls execution order when multiple hooks exist
- Lower weights execute first (negative to positive)
- Pre-install migration: `-5` (runs before everything)
- Post-install sync: `5` (runs after everything)

### `helm.sh/hook-delete-policy`

- **`before-hook-creation`**: Delete previous hook resource before creating new one
- Prevents job name conflicts
- Keeps cluster clean from old job resources

## Migration Checklist

### Pre-Migration

- [ ] Backup current Helm releases
- [ ] Document current pipeline execution order
- [ ] Verify all environment variables used by pre/post-deployment jobs
- [ ] Test migration in test environment first

### Migration Execution

- [ ] Create hook templates in `kubernetes/helm/web-app/templates/`
- [ ] Update `values.test.yaml` with hooks configuration
- [ ] Update `values.prod.yaml` with hooks configuration
- [ ] Update `azp/stages/deploy-environment.yml` (single stage)
- [ ] Update `azp/jobs/web-app-deployment.yml` (hook image tags)
- [ ] Test deployment in test environment
- [ ] Verify migration job executes successfully
- [ ] Verify sync job executes successfully
- [ ] Verify web app deployment succeeds
- [ ] Deploy to production
- [ ] Verify production deployment

### Post-Migration Cleanup

- [ ] Delete `kubernetes/helm/pre-deployment/` directory
- [ ] Delete `kubernetes/helm/post-deployment/` directory
- [ ] Delete `azp/jobs/pre-deployment.yml`
- [ ] Delete `azp/jobs/post-deployment.yml`
- [ ] Remove unused pipeline variables
- [ ] Update documentation

## Testing Procedure

### Test Environment

```bash
# 1. Deploy to test namespace
helm upgrade web-app ./kubernetes/helm/web-app \
  -n map-poster-test \
  --install \
  --values ./kubernetes/helm/web-app/values.test.yaml \
  --set image.tag=<your-tag> \
  --set hooks.preInstall.image.tag=<your-tag> \
  --set hooks.postInstall.image.tag=<your-tag>

# 2. Watch hook execution
kubectl get jobs -n map-poster-test -w

# 3. Check migration job logs
kubectl logs -n map-poster-test job/web-app-pre-install-migration

# 4. Check sync job logs
kubectl logs -n map-poster-test job/web-app-post-install-sync

# 5. Verify web app deployment
kubectl get pods -n map-poster-test
kubectl logs -n map-poster-test deployment/web-app
```

### Verify Hook Execution Order

```bash
# Check hook execution in release history
helm history web-app -n map-poster-test

# List all resources created by release (includes hooks)
helm get manifest web-app -n map-poster-test
```

## Rollback Strategy

### If Migration Fails

```bash
# Rollback to previous Helm release
helm rollback web-app -n map-poster-test

# Redeploy using old pipeline method
# (Old charts still exist until cleanup phase)
```

### Emergency Rollback

If hooks cause issues, disable them temporarily:

```bash
helm upgrade web-app ./kubernetes/helm/web-app \
  -n map-poster-test \
  --set hooks.preInstall.enabled=false \
  --set hooks.postInstall.enabled=false \
  --values ./kubernetes/helm/web-app/values.test.yaml
```

## Benefits After Migration

1. **Atomic Deployments**: Single `helm upgrade` command handles everything
2. **Automatic Ordering**: Helm guarantees execution order
3. **Rollback Support**: `helm rollback` includes hook history
4. **Simplified Pipeline**: Single stage per environment instead of three
5. **Reduced Maintenance**: One chart instead of three
6. **Better Observability**: `helm history` shows complete deployment lifecycle
7. **Consolidated Secrets**: Hooks use the same `web-app-secrets` as the main app

## Troubleshooting

### Hook Job Fails

```bash
# Check job status
kubectl describe job <job-name> -n <namespace>

# View logs
kubectl logs job/<job-name> -n <namespace>

# Delete stuck job manually
kubectl delete job <job-name> -n <namespace>
```

### Hook Doesn't Execute

- Verify annotations are correct in template
- Check `helm.sh/hook-weight` ordering
- Ensure hook template is not disabled in values

### Database Migration Fails

- Check `DATABASE_URL` in `web-app-secrets` exists and is correct
- Verify migration container has database connectivity
- Check migration logs for SQL errors

### Post-Deployment Can't Reach Web App

- Verify `INTERNAL_BASE_URL` resolves correctly
- Check web app service is running: `kubectl get svc -n <namespace>`
- Test connectivity: `kubectl run curl --rm -it --image=curlimages/curl -- curl http://web-app.<namespace>.svc.cluster.local:3000`

## References

- [Helm Hooks Documentation](https://helm.sh/docs/topics/charts_hooks/)
- [Kubernetes Jobs Documentation](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- Current implementation: `kubernetes/helm/pre-deployment/`, `kubernetes/helm/post-deployment/`
