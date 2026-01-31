---
description: Analyze context and write appropriate tests (unit preferred, integration/e2e after confirmation)
argument-hint: [type: unit|trpc|e2e] [scope: path or feature]
---

# Write Tests

$ARGUMENTS

Analyze current work (edited files, git diff, conversation context) and write appropriate tests.

## Process

1. **Analyze context**

   - Check git diff for recent changes
   - Look at edited files in conversation
   - Identify what functionality changed

2. **Determine test type** (prefer simpler):

   - `packages/*/src/*.ts` -> **Unit test** (write immediately)
   - TRPC routers -> **Integration test** (ask first)
   - Routes/UI -> **E2E test** (ask + justify)

3. **Write or ask**:
   - Unit: Write immediately, run `bun run test`
   - TRPC Integration: Ask "Does an integration test make sense here?"
   - E2E: Ask + warn "E2E tests are expensive to maintain. Is this necessary?"

## Arguments

- `/write-tests` - Auto-detect from context
- `/write-tests unit` - Only unit tests
- `/write-tests trpc` - TRPC integration test (will ask for confirmation)
- `/write-tests e2e` - E2E test (will ask + warn)
- `/write-tests packages/services/src/k8s/` - Tests for specific path

## Load skill for patterns

Before writing, load `testing-patterns` skill for:

- Effect mock layer patterns
- TRPC createTestCaller usage
- Playwright auth helpers

## After writing

Always run:

```bash
bun run test  # Verify tests pass
```
