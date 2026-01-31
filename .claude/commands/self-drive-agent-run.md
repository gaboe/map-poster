---
description: Self-driving agent run - create, execute and iterate autonomously
agent: build
allowed-tools: Bash(git:*), Bash(bun:*), Bash(tail:*), Bash(date:*)
argument-hint: [task description]
---

# Self-Drive Agent Run

$ARGUMENTS

If the task is unclear, ask for clarification before proceeding.

## Workflow

### 1. Understand the Task

Parse the request above. If unclear, ask clarifying questions before proceeding.

### 2. Get Available Agents

Use Postgres MCP to find available agent instances:

```sql
SELECT ai.id, ai.name, at.type as agent_type
FROM agent_instances ai
JOIN agent_templates at ON ai.template_id = at.id
```

### 3. Generate Run ID

Generate a cuid2 ID for the new run:

```bash
bun -e "import { createId } from '@paralleldrive/cuid2'; console.log(createId())"
```

### 4. Create Agent Run

Use Postgres MCP to insert the run (must include `started_at`):

```sql
INSERT INTO agent_runs (id, agent_instance_id, status, started_at)
VALUES ('<generated-id>', '<selected-agent-id>', 'pending', NOW())
RETURNING id, status, started_at
```

### 5. Execute & Monitor

Run the agent:

```bash
bun run dev:runner
```

For dry run (no GitHub issues created):

```bash
bun run dev:runner:dry
```

Check logs after execution:

```bash
tail -50 jobs/agent-runner/logs/app.$(date +%Y-%m-%d).1.log
```

### 6. Check Results

Query run status via Postgres MCP:

```sql
SELECT id, status, duration_ms, issue_count, error_message
FROM agent_runs WHERE id = '<run-id>'
```

### 7. Iterate

Based on results:

1. **If code changes needed:**
   - Analyze error messages and logs
   - Make code fixes
   - Run `bun run check` to validate
   - Create new run and repeat

2. **If feature development:**
   - Implement the next piece
   - Test with agent run
   - Iterate until complete

### When to Stop and Ask

- Requirements are unclear
- Major architectural decisions needed
- After 5 failed iterations
- Security-sensitive changes
- Need to modify production data

### 8. Report

When complete, summarize:

- What was accomplished
- Files changed
- Test results
- Any remaining issues

## State

!`git status --short && git log -3 --oneline`
