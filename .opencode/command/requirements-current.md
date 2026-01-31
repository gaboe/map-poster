---
description: Display detailed information about the active requirement
---

# View Current Requirement

$ARGUMENTS

Display detailed information about the active requirement.

## Instructions

1. Read `requirements/.current-requirement`

2. **If no active requirement:**

   ```
   No active requirement.

   Recent completed requirements:
   [Show last 3 completed with dates]

   Start new: /requirements-start [description]
   List all: /requirements-list
   ```

3. **For active requirement:**
   - Load all files from requirement folder
   - Display comprehensive status
   - Show codebase analysis overview
   - Show all questions and answers so far
   - Display context findings if available
   - Indicate current phase and next steps

## File Structure

```
requirements/[timestamp]-[slug]/
├── 00-initial-request.md    # Original user request
├── 01-discovery-questions.md # Context discovery questions
├── 02-discovery-answers.md   # User's answers (after all asked)
├── 03-context-findings.md    # AI's codebase analysis
├── 04-detail-questions.md    # Expert requirements questions
├── 05-detail-answers.md      # User's detailed answers
├── 06-requirements-spec.md   # Final requirements document
└── metadata.json             # Status tracking
```

## Display Format

```
===========================================
Current Requirement: [name]
===========================================

Duration: [time since start]
Phase: [Initial Setup/Discovery/Context/Detail/Complete]
Progress: [total answered]/[total questions]

-------------------------------------------
INITIAL REQUEST
-------------------------------------------

[Content from 00-initial-request.md]

-------------------------------------------
CODEBASE OVERVIEW (Phase 1)
-------------------------------------------

Architecture: TanStack Start + TRPC + PostgreSQL + Drizzle
Relevant modules identified:
- [module 1]: [why relevant]
- [module 2]: [why relevant]

-------------------------------------------
DISCOVERY PHASE (5/5 complete)
-------------------------------------------

Q1: Will this be organization-scoped? YES
Q2: Will users interact through a new page? YES
Q3: Does this require new database tables? NO
Q4: Will this integrate with external APIs? NO (default)
Q5: Should this be accessible to all members? YES

-------------------------------------------
CONTEXT FINDINGS
-------------------------------------------

Similar Features Found:
- [Feature] at [path] - [pattern to follow]

Files to Modify:
- apps/web-app/src/[module]/trpc/[router].ts
- packages/db/src/schema.ts (if needed)

Patterns Identified:
- TRPC: [pattern reference]
- Frontend: [pattern reference]

-------------------------------------------
EXPERT QUESTIONS (2/5 answered)
-------------------------------------------

Q1: Extend existing UserRouter? YES
Q2: Follow pattern from ProjectSettings? YES
Q3: Cache data in TanStack Query? [PENDING]
Q4: Add E2E tests? [PENDING]
Q5: Validation on both client and server? [PENDING]

-------------------------------------------
NEXT ACTION
-------------------------------------------

Current: Answering expert question Q3

Options:
- Continue: /requirements-status
- End early: /requirements-end
- View all: /requirements-list
```

## Important Notes

- This is **view-only** (doesn't continue gathering)
- Shows complete history and context
- Use `/requirements-status` to continue answering questions
- All file paths are relative to vivus project root
