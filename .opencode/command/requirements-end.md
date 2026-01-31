---
description: Finalize or cancel the current requirement gathering session
---

# End Requirements Gathering

$ARGUMENTS

Finalize the current requirement gathering session.

## Instructions

1. Read `requirements/.current-requirement`

2. **If no active requirement:**

   ```
   No active requirement to end.

   Use /requirements-list to see all requirements.
   ```

3. **Show current status and ask user intent:**

   ```
   Ending requirement: [name]
   Current phase: [phase] ([X/Y] complete)

   What would you like to do?

   1. Generate spec with current information
   2. Mark as incomplete for later
   3. Cancel and delete

   Choose (1/2/3):
   ```

4. **Based on choice:**

### Option 1: Generate Spec

- Create `06-requirements-spec.md`
- Include all answered questions
- Add defaults for unanswered with "ASSUMED:" prefix
- Generate implementation hints based on vivus patterns
- Update `metadata.json` status to "complete"

**Spec format:**

```markdown
# Requirements Specification: [Name]

Generated: [timestamp]
Status: Complete with [N] assumptions

## Overview

[Problem statement from initial request]
[Solution summary based on answers]

## Functional Requirements

[Based on answered questions]

### User Stories
- As a [role], I want to [action] so that [benefit]

### Acceptance Criteria
- [ ] [Criterion based on answers]

## Technical Requirements

### Database Changes
[If applicable based on answers]

### TRPC Router
- Location: `apps/web-app/src/[module]/trpc/`
- Procedures needed: [list]

### Frontend Routes
- Path: `/app/[route]`
- Components: [list]

### Files to Create/Modify
[Specific paths in vivus codebase]

## Implementation Notes

### Patterns to Follow
- TRPC: Load skill `trpc-patterns`
- Frontend: Load skill `tanstack-frontend`

### Validation
- Run `bun run check` after implementation
- Add E2E tests if user-facing

## Assumptions (REVIEW THESE)

[List any defaults used for unanswered questions]
- ASSUMED: [Question] -> [Default used] because [reason]

## Next Steps

1. Review assumptions above
2. Start implementation
3. Run `/code-review` before PR
```

### Option 2: Mark Incomplete

- Update `metadata.json`:
  ```json
  {
    "status": "incomplete",
    "lastUpdated": "[timestamp]",
    "pausedAt": "[phase]",
    "remainingQuestions": [N]
  }
  ```
- Create summary of progress
- Note what's still needed

**Output:**

```
Requirement marked as incomplete.

Progress saved:
- Phase: [current phase]
- Questions answered: [X/Y]
- Last activity: [now]

To resume later: /requirements-status
```

### Option 3: Cancel

- Confirm deletion:

  ```
  Are you sure you want to delete this requirement?
  All gathered information will be lost.

  Type 'yes' to confirm:
  ```

- If confirmed:
  - Remove requirement folder
  - Clear `.current-requirement`

**Output:**

```
Requirement cancelled and deleted.

Start fresh: /requirements-start [description]
```

## Post-Completion

After generating spec (Option 1):

1. Clear `.current-requirement`
2. Show summary:

   ```
   Requirements complete!

   Spec saved: requirements/[folder]/06-requirements-spec.md

   Next steps:
   1. Review the spec, especially ASSUMPTIONS section
   2. Start implementation
   3. Use /code-review before creating PR

   View spec: Read @requirements/[folder]/06-requirements-spec.md
   ```
