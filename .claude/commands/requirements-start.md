---
description: Start gathering requirements for a new feature with structured Q&A workflow
---

# Start Requirements Gathering

Begin gathering requirements for: $ARGUMENTS

## Full Workflow

### Phase 1: Initial Setup & Codebase Analysis

1. Get current timestamp: `!`date "+%Y-%m-%d-%H%M"``
2. Extract slug from $ARGUMENTS (e.g., "add user profile" -> "user-profile")
3. Create folder: `requirements/[timestamp]-[slug]/`
4. Create initial files:
   - `00-initial-request.md` with the user's request
   - `metadata.json` with status tracking
5. Create/update `requirements/.current-requirement` with folder name
6. Analyze vivus codebase structure:
   - `apps/web-app/` - TanStack Start frontend + TRPC server
   - `packages/` - Shared packages (db, services, common, logger, agents)
   - Identify relevant existing features and patterns

### Phase 2: Context Discovery Questions

Generate 5 yes/no questions to understand the problem space:

**Focus areas for vivus:**

- User interactions and workflows
- Organization/project scope (org-scoped vs user-scoped)
- Data model requirements (new tables vs extending existing)
- UI requirements (new pages vs extending existing)
- Integration with existing features (auth, billing, integrations)

**Question format:**

```markdown
## Q1: Will this feature be organization-scoped (vs user-scoped)?
**Default if unknown:** Yes (most vivus features are org-scoped)

## Q2: Will users interact with this through a new page/route?
**Default if unknown:** Yes (most features have dedicated UI)

## Q3: Does this require new database tables?
**Default if unknown:** No (prefer extending existing schema)

## Q4: Will this integrate with external services/APIs?
**Default if unknown:** No (unless explicitly mentioned)

## Q5: Should this be accessible to all org members or only admins?
**Default if unknown:** All members (with appropriate role checks)
```

**Process:**

1. Write ALL questions to `01-discovery-questions.md` with smart defaults
2. Ask questions ONE at a time, proposing default
3. Accept: yes / no / idk (use default)
4. After ALL answered, record in `02-discovery-answers.md`
5. Update `metadata.json`

### Phase 3: Targeted Context Gathering (Autonomous)

After discovery questions answered:

1. **Search relevant code** using available tools:
   - Find similar features in `apps/web-app/src/`
   - Check existing TRPC routers in `apps/web-app/src/*/trpc/`
   - Review database schema in `packages/db/src/schema.ts`
   - Check existing UI patterns in `apps/web-app/src/shared/`

2. **Analyze patterns** from similar features:
   - How similar TRPC routers are structured
   - How similar pages use TanStack Router loaders
   - Database table conventions
   - Form handling patterns

3. **Document findings** in `03-context-findings.md`:

   ```markdown
   ## Codebase Analysis

   ### Similar Features Found
   - [Feature name] at [path] - [why relevant]

   ### Relevant Files to Modify/Extend
   - `apps/web-app/src/[module]/trpc/[router].ts` - [what to add]
   - `packages/db/src/schema.ts` - [new tables if needed]

   ### Patterns to Follow
   - TRPC router pattern from [example]
   - TanStack route pattern from [example]
   - Form pattern from [example]

   ### Technical Constraints
   - [Any limitations discovered]

   ### Integration Points
   - [Services/modules this will interact with]
   ```

### Phase 4: Expert Requirements Questions

Now ask questions like a senior developer who knows the vivus codebase:

**Focus on clarifying system behavior:**

```markdown
## Q1: Should we extend the existing [Router]Router at [path]?
**Default if unknown:** Yes (maintains consistency)

## Q2: For the UI, should we follow the pattern from [similar feature]?
**Default if unknown:** Yes (established pattern)

## Q3: Should this data be cached in TanStack Query or fetched fresh?
**Default if unknown:** Cached (standard for most data)

## Q4: Should we add E2E tests for this flow?
**Default if unknown:** Yes (if user-facing feature)

## Q5: Should validation happen client-side, server-side, or both?
**Default if unknown:** Both (Zod on frontend, TRPC input validation on backend)
```

**Process:**

1. Write questions to `04-detail-questions.md`
2. Ask ONE at a time
3. Record answers in `05-detail-answers.md` after all asked

### Phase 5: Requirements Documentation

Generate comprehensive spec in `06-requirements-spec.md`:

```markdown
# Requirements Specification: [Name]

Generated: [timestamp]
Status: Complete

## Overview

[Problem statement and solution summary]

## Functional Requirements

### User Stories
- As a [role], I want to [action] so that [benefit]

### Acceptance Criteria
- [ ] [Testable criterion]

## Technical Requirements

### Database Changes
- New table: [name] in `packages/db/src/schema.ts`
- Fields: [list with types]

### TRPC Router
- Location: `apps/web-app/src/[module]/trpc/[name].ts`
- Procedures: [list]
- Use `protectedMemberAccessProcedure` for org-scoped operations

### Frontend Routes
- New route: `/app/[path]`
- Components: [list]
- Pattern to follow: [reference]

### Files to Create/Modify
1. `packages/db/src/schema.ts` - Add table
2. `apps/web-app/src/[module]/trpc/[name].ts` - Add router
3. `apps/web-app/src/routes/app/[path]/route.tsx` - Add page

## Implementation Notes

### Patterns to Follow
- TRPC: See `trpc-patterns` skill
- Frontend: See `tanstack-frontend` skill

### Testing
- Unit tests in `packages/services/src/__tests__/`
- E2E tests in `apps/web-app/e2e/`

## Assumptions

[Any defaults used for unanswered questions]
```

---

## Important Rules

- **ONLY yes/no questions** with smart defaults
- **ONE question at a time**
- Write ALL questions to file BEFORE asking any
- Stay focused on requirements (no implementation)
- Use actual file paths from vivus codebase
- Document WHY each default makes sense
- Reference similar existing features as examples

## Metadata Structure

```json
{
  "id": "feature-slug",
  "started": "ISO-8601-timestamp",
  "lastUpdated": "ISO-8601-timestamp",
  "status": "active",
  "phase": "discovery|context|detail|complete",
  "progress": {
    "discovery": { "answered": 0, "total": 5 },
    "detail": { "answered": 0, "total": 5 }
  },
  "contextFiles": ["paths/of/files/analyzed"],
  "relatedFeatures": ["similar features found"]
}
```

## Phase Transitions

- After each phase, announce: "Phase complete. Starting [next phase]..."
- Save all work before moving to next phase
- User can check progress anytime with `/requirements-status`
