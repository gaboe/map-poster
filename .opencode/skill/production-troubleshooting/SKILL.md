---
name: production-troubleshooting
description: "LOAD THIS SKILL when: user reports prod/test issues, slow performance, errors in deployed env, or mentions 'production', 'test env', 'slow', 'Sentry', 'pod', 'kubernetes', 'k8s'. Provides systematic investigation with Sentry traces, kubectl, pod health, resource analysis."
---

# Production Troubleshooting

## Overview

Diagnose performance issues and errors in production/test environments using systematic investigation workflows with Sentry, kubectl, and Helm configuration analysis.

## When to Use This Skill

Use this skill when:

- User reports performance issues on test/production (not localhost)
- Need to investigate slow queries or high latency
- Debugging pod crashes or resource throttling
- Analyzing Sentry traces for errors
- Checking Kubernetes resource limits and configurations

## Investigation Workflow

Follow these steps in order when troubleshooting production issues:

### Step 1: Check Sentry Traces

Start with Sentry to identify slow queries and external API latency patterns.

**Using Sentry MCP:**

- Search for traces related to the reported issue
- Look for slow database queries (>500ms)
- Check external API call latency
- Identify error patterns and stack traces

**What to look for:**

- Database query times exceeding 500ms
- External API calls with high latency
- Repeated error patterns
- Performance degradation trends

### Step 2: Review Application Logs

Examine kubectl logs for timing information and error patterns.

**Using the `check-logs.sh` script:**

```bash
scripts/check-logs.sh <pod-name> [namespace]
```

**Key log patterns to search for:**

- `[Server]` - Server startup and initialization timing
- `[SSR]` - Server-side rendering timing
- `[tRPC]` - TRPC query execution timing
- `[DB Pool]` - Database connection pool status
- `ERROR` or `WARN` - Application errors and warnings

**Common issues:**

- Sequential API calls instead of parallel (Promise.all)
- Long DB connection acquisition times
- Slow SSR rendering

### Step 3: Check Pod Resource Usage

Verify CPU and memory usage to detect throttling.

**Using kubectl:**

```bash
kubectl top pod -n <namespace>
kubectl top node
```

**Using the `check-pod-resources.sh` script:**

```bash
scripts/check-pod-resources.sh <namespace>
```

**Warning signs:**

- CPU usage >70% indicates potential throttling
- Memory usage >80% indicates potential OOM issues
- Consistent high utilization suggests under-provisioning

### Step 4: Review Pod Configuration

Check resource limits and Helm values to identify misconfigurations.

**Using kubectl:**

```bash
kubectl get pod <pod-name> -n <namespace> -o yaml
```

**Key sections to check:**

- `resources.limits.cpu` and `resources.limits.memory`
- `resources.requests.cpu` and `resources.requests.memory`
- Environment variables configuration
- Image version and tags

**Helm values locations:**

- web-app: `/kubernetes/helm/web-app/values.{test,prod}.yaml`

Reference `references/helm-values-locations.md` for detailed Helm configuration structure.

## Common Causes & Solutions

### CPU/Memory Throttling

- **Symptom:** High CPU/memory usage (>70-80%)
- **Solution:** Increase resource limits in Helm values

### Network Latency

- **Symptom:** Slow external API calls, DNS resolution delays
- **Solution:** Check network policies, verify DNS configuration, consider retry logic

### Database Connection Pool Issues

- **Symptom:** `[DB Pool]` errors, slow connection acquisition
- **Solution:** Review `idleTimeoutMillis` and pool size configuration

### Sequential API Calls

- **Symptom:** Multiple API calls taking cumulative time
- **Solution:** Refactor to use `Promise.all()` for parallel execution

## Resources

### scripts/

Helper scripts for common kubectl operations:

- `check-logs.sh` - Extract and filter pod logs with timing information
- `check-pod-resources.sh` - Show CPU/memory usage for all pods in namespace
- `analyze-helm-values.sh` - Compare resource limits across environments

### references/

- `helm-values-locations.md` - Detailed guide to Helm values file structure and locations
- `common-issues.md` - Catalog of common production issues and solutions
