---
name: azure-devops-debugging
description: "LOAD THIS SKILL when: debugging Azure DevOps pipelines, fetching build logs, investigating pipeline failures, or user mentions 'Azure DevOps', 'pipeline', 'build', 'deployment'. Covers authentication patterns, API commands, pipeline debugging."
---

# Azure DevOps Debugging

## Overview

Debug Azure DevOps pipeline failures, fetch build logs, and investigate CI/CD issues using the Azure CLI and REST API.

## When to Use This Skill

Use this skill when:

- Investigating failed Azure DevOps pipeline runs
- Fetching build logs and error messages
- Listing projects, pipelines, or builds
- Debugging CI/CD deployment issues
- Extracting error patterns from pipeline failures

## Prerequisites

### Authentication Check

Before using Azure DevOps commands, verify authentication:

```bash
az account show
```

If not logged in, **ask the user to authenticate**:

```bash
az login
```

For Azure DevOps specifically, you may need:

```bash
az devops login
```

### Organization Information

**Primary Azure DevOps Organization:**

- **Organization Name:** `devops-blogic`
- **Organization URL:** `https://dev.azure.com/devops-blogic`
- **Main Projects:** `map-poster`, `Vivus`, `Ibis`, `Fakturoid`, `BLogic.OPUS`

## Authentication for REST API

Azure DevOps REST API requires a Bearer token. Get it with:

```bash
# Get access token for Azure DevOps
TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
```

**Resource ID `499b84ac-1321-427f-aa17-267ca6975798`** is the Azure DevOps service principal.

## Common Commands

### Using Azure CLI (Preferred)

```bash
# Set default organization (do this first!)
az devops configure --defaults organization=https://dev.azure.com/devops-blogic

# List all projects
az devops project list --output table

# List pipelines in a project
az pipelines list --project map-poster --output table

# List recent builds
az pipelines build list --project map-poster --top 10 --output table

# List failed builds only
az pipelines build list --project map-poster --result failed --top 20 --output table

# Get build details
az pipelines build show --project map-poster --id <build-id>

# Get build logs
az pipelines build log list --project map-poster --build-id <build-id>
az pipelines build log show --project map-poster --build-id <build-id> --log-id <log-id>
```

### Using REST API (When CLI is insufficient)

Some operations require direct REST API calls:

```bash
TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)

# List projects
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/_apis/projects?api-version=7.0" | jq '.value[].name'

# List failed builds in a project
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds?\$top=50&resultFilter=failed&api-version=7.0" | jq '.value[] | {id, buildNumber, result}'

# Get build timeline (contains error messages)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/timeline?api-version=7.0"

# Get build logs list
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs?api-version=7.0"

# Get specific log content
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs/<log-id>?api-version=7.0"
```

## Extracting Error Messages

### From Timeline (Recommended)

The timeline contains structured error information:

```bash
TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)

# Get errors from timeline
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/timeline?api-version=7.0" | \
  jq '.records[] | select(.issues != null) | {name, result, issues: [.issues[].message]}'
```

### From Logs

Search for error patterns in logs:

```bash
# Get log content and search for errors
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs/<log-id>?api-version=7.0" | \
  grep -E "##\[error\]|Error:|FAILED:|failed with"
```

## Common Error Patterns

Based on production data from `devops-blogic`:

| Error Type       | Example Message                                                 |
| ---------------- | --------------------------------------------------------------- |
| Helm timeout     | `Error: UPGRADE FAILED: context deadline exceeded`              |
| E2E timeout      | `TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.`  |
| Coverage missing | `No code coverage results were found to publish.`               |
| Path not found   | `Path does not exist: /opt/agents/.../coverage`                 |
| Test failures    | `There are one or more test failures detected in result files.` |
| K8s validation   | `Warning: Validation failed for ValidatingAdmissionPolicy...`   |
| Script exit      | `error: script "check:ci" exited with code 1`                   |
| ESLint error     | `x typescript-eslint(consistent-type-imports): All imports...`  |
| Effect linter    | `effect(runEffectInsideEffect)`, `effect(unknownInEffectCatch)` |

## Extracting Real Errors (Not Just "Bash exited with code 1")

The timeline often only shows generic "Bash exited with code 1". To get the **real error**, you need to fetch the actual log content:

### Step 1: Get Failed Step Log ID

```bash
TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)

# Get failed steps with their log IDs
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/timeline?api-version=7.0" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for record in data.get('records', []):
    if record.get('result') == 'failed' and record.get('log'):
        print(f'Step: {record.get(\"name\")}')
        print(f'Log ID: {record[\"log\"][\"id\"]}')
        print()
"
```

### Step 2: Fetch Log Content and Extract Real Error

```bash
# Get the log content
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs/<log-id>?api-version=7.0" | tail -100

# Or search for specific error patterns:
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs/<log-id>?api-version=7.0" | \
  grep -E "x typescript-eslint|effect\(|Found \d+ .* errors|TimeoutError|AssertionError|FAIL |Error:" | head -10
```

### Error Pattern Recognition in Logs

| Pattern in Log                       | Real Error Type                          |
| ------------------------------------ | ---------------------------------------- |
| `x typescript-eslint(...)`           | ESLint rule violation                    |
| `effect(runEffectInsideEffect)`      | Effect linter - nested Effect.runPromise |
| `effect(unknownInEffectCatch)`       | Effect linter - untyped catch callback   |
| `Found 0 warnings and N errors`      | ESLint summary                           |
| `TimeoutError: page.waitForSelector` | Playwright E2E timeout                   |
| `AssertionError:`                    | Test assertion failed                    |
| `FAIL `                              | Test suite failed                        |
| `Error: UPGRADE FAILED:`             | Helm deployment error                    |

## Troubleshooting

### Token Expired

If you get 401 errors, refresh the token:

```bash
TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
```

### Project Not Found

URL-encode project names with spaces:

```bash
# For "My Project" use:
curl ... "https://dev.azure.com/devops-blogic/My%20Project/_apis/..."
```

### Large JSON Responses

For large responses, save to file first:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds?..." > /tmp/builds.json

# Then parse with Python (more robust than jq for large files)
python3 -c "import json; d=json.load(open('/tmp/builds.json')); print(d['count'])"
```

## Debugging Workflow

1. **List recent failed builds:**

   ```bash
   az pipelines build list --project map-poster --result failed --top 10 --output table
   ```

2. **Get timeline for specific build:**

   ```bash
   TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/timeline?api-version=7.0" | \
     jq '.records[] | select(.result == "failed") | {name, issues: [.issues[]?.message]}'
   ```

3. **Get detailed logs if needed:**

   ```bash
   # List logs
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs?api-version=7.0" | \
     jq '.value[] | {id, lineCount}'

   # Get specific log (usually largest has the error)
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://dev.azure.com/devops-blogic/map-poster/_apis/build/builds/<build-id>/logs/<log-id>?api-version=7.0" | \
     grep -E "error|Error|FAILED" | head -20
   ```
