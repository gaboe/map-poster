# Barrel Exports Cleanup

## TL;DR

> **Quick Summary**: Remove 3 convenience barrel files and update 21 consumer files to use direct imports, eliminating hidden dependencies and improving dev server performance.
> 
> **Deliverables**:
> - Delete 3 barrel files (`forms/index.ts`, `layout/index.tsx`, `procedures/index.ts`)
> - Update 21 files with direct import paths
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 3 waves (import updates parallelized by barrel group)
> **Critical Path**: Update imports → Delete barrels → Validate

---

## Context

### Original Request
Analyze and clean up barrel export files (index.ts/index.tsx that only re-export from other files) while preserving structural/required barrels.

### Analysis Summary
**Analyzed 20 barrel files:**
- 3 convenience barrels to DELETE (pure re-exports, no logic)
- 17 structural barrels to KEEP (package entries, route files, files with logic)

**Files to delete:**
1. `apps/web-app/src/shared/forms/index.ts` - 2 consumers
2. `apps/web-app/src/shared/layout/index.tsx` - 9 consumers
3. `apps/web-app/src/infrastructure/trpc/procedures/index.ts` - 10 consumers

**Why remove them:**
- Circular imports - Hard to debug runtime errors
- Slower dev server - Imports load all re-exported modules
- Hidden dependencies - Makes code harder to trace

---

## Work Objectives

### Core Objective
Remove convenience barrel files and convert all imports to direct file paths.

### Concrete Deliverables
- 3 barrel files deleted
- 21 files updated with direct imports

### Definition of Done
- [x] `grep -r 'from "@/shared/forms"$' apps/web-app/src` returns no matches
- [x] `grep -r 'from "@/shared/layout"$' apps/web-app/src` returns no matches
- [x] `grep -r 'from "@/infrastructure/trpc/procedures"$' apps/web-app/src` returns no matches
- [x] `bun run check` passes

### Must Have
- All imports converted to direct paths before deleting barrels
- No breaking changes to exports (same symbols accessible via direct paths)

### Must NOT Have (Guardrails)
- Do NOT delete package entry points (`packages/*/src/index.ts`)
- Do NOT delete route index files (TanStack Router convention)
- Do NOT delete files with actual logic (only pure re-export barrels)
- Do NOT modify the exported symbols themselves - only import paths

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **User wants tests**: Manual-only (this is pure refactoring, no logic changes)
- **Framework**: N/A

### Automated Verification

Each TODO includes EXECUTABLE verification:

```bash
# Verify specific barrel import is gone
grep -r 'from "@/shared/forms"$' apps/web-app/src --include="*.ts" --include="*.tsx"

# Build check verifies all imports resolve
bun run check
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - PARALLEL):
├── Task 1: Update forms barrel consumers (2 files)
├── Task 2: Update layout barrel consumers (9 files)  
└── Task 3: Update procedures barrel consumers (10 files)

Wave 2 (After Wave 1 - SEQUENTIAL):
└── Task 4: Delete barrel files and validate

Critical Path: Tasks 1,2,3 (parallel) → Task 4
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4 | 2, 3 |
| 2 | None | 4 | 1, 3 |
| 3 | None | 4 | 1, 2 |
| 4 | 1, 2, 3 | None | None (final) |

---

## TODOs

- [x] 1. Update forms barrel consumers

  **What to do**:
  - Update `apps/web-app/src/shared/ui/contact-sales-modal.tsx`:
    - Change `import { FormInput, FormTextarea } from "@/shared/forms"`
    - To: `import { FormInput } from "@/shared/forms/form-input"` and `import { FormTextarea } from "@/shared/forms/form-textarea"`
  - Update `apps/web-app/src/shared/contact-form.tsx`:
    - Same pattern as above

  **Must NOT do**:
  - Do NOT change any component logic
  - Do NOT rename any imports

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple 2-file import path change
  - **Skills**: `[]`
    - No special skills needed - pure import refactoring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `apps/web-app/src/shared/forms/index.ts` - Current barrel file showing export mappings
  - `apps/web-app/src/shared/forms/form-input.tsx` - Direct export source
  - `apps/web-app/src/shared/forms/form-textarea.tsx` - Direct export source

  **Acceptance Criteria**:
  ```bash
  # Verify no forms barrel imports in these files
  grep -c 'from "@/shared/forms"$' apps/web-app/src/shared/ui/contact-sales-modal.tsx apps/web-app/src/shared/contact-form.tsx
  # Expected: 0 matches (or "No such file" for each)
  
  # Verify direct imports exist
  grep -c 'from "@/shared/forms/form-input"' apps/web-app/src/shared/ui/contact-sales-modal.tsx
  # Expected: 1
  ```

  **Commit**: NO (groups with Task 4)

---

- [x] 2. Update layout barrel consumers

  **What to do**:
  - Update 9 files to change `import { AppLayout } from "@/shared/layout"` to `import { AppLayout } from "@/shared/layout/app-layout"`
  
  **Files to update**:
  1. `apps/web-app/src/routes/app/organization/$id/settings.tsx`
  2. `apps/web-app/src/routes/app/organization/$id/index.tsx`
  3. `apps/web-app/src/routes/app/organization/$id/members.tsx`
  4. `apps/web-app/src/routes/app/dashboard.tsx`
  5. `apps/web-app/src/routes/app/admin/index.tsx`
  6. `apps/web-app/src/routes/app/admin/observability.tsx`
  7. `apps/web-app/src/routes/app/admin/users.tsx`
  8. `apps/web-app/src/routes/app/project/$id/settings.tsx`
  9. `apps/web-app/src/routes/app/project/$id/index.tsx`

  **Must NOT do**:
  - Do NOT change any route logic or loaders
  - Do NOT modify any other imports in these files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Repetitive single-line changes across 9 files
  - **Skills**: `[]`
    - No special skills needed - pure import refactoring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `apps/web-app/src/shared/layout/index.tsx` - Current barrel showing exports
  - `apps/web-app/src/shared/layout/app-layout.tsx` - Direct export source

  **Acceptance Criteria**:
  ```bash
  # Verify no layout barrel imports remain
  grep -r 'from "@/shared/layout"$' apps/web-app/src --include="*.tsx"
  # Expected: No matches
  
  # Verify direct imports exist (spot check)
  grep -c 'from "@/shared/layout/app-layout"' apps/web-app/src/routes/app/dashboard.tsx
  # Expected: 1
  ```

  **Commit**: NO (groups with Task 4)

---

- [x] 3. Update procedures barrel consumers

  **What to do**:
  - Update 10 files to use direct imports from procedure source files
  
  **Import mapping** (from `procedures/index.ts` analysis):
  - `publicProcedure`, `protectedProcedure`, `adminProcedure` → `@/infrastructure/trpc/procedures/auth`
  - `protectedOrganizationMemberProcedure`, `protectedOrganizationAdminProcedure` → `@/infrastructure/trpc/procedures/organization`
  - `protectedProjectMemberProcedure`, `protectedProjectAdminProcedure`, `protectedProjectEditorProcedure` → `@/infrastructure/trpc/procedures/project-access`

  **Files to update**:
  1. `apps/web-app/src/organizations/trpc/invitations.ts` - uses organization procedures
  2. `apps/web-app/src/organizations/trpc/organization.ts` - uses organization + auth procedures
  3. `apps/web-app/src/organizations/trpc/members.ts` - uses organization procedures
  4. `apps/web-app/src/contact/trpc/router.ts` - uses publicProcedure (auth)
  5. `apps/web-app/src/projects/trpc/project.ts` - uses auth + project-access procedures
  6. `apps/web-app/src/admin/trpc/admin.ts` - uses adminProcedure (auth)
  7. `apps/web-app/src/admin/trpc/observability.ts` - uses adminProcedure (auth)
  8. `apps/web-app/src/project-permissions/trpc/project-permissions.ts` - uses protectedProcedure (auth)
  9. `apps/web-app/src/users/trpc/user.ts` - uses auth procedures
  10. `apps/web-app/src/infrastructure/trpc/testing.ts` - uses protectedProcedure (auth)

  **Must NOT do**:
  - Do NOT change procedure implementations
  - Do NOT modify router logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Repetitive import path changes, well-defined mapping
  - **Skills**: `["trpc-patterns"]`
    - `trpc-patterns`: Understanding TRPC router structure helps navigate procedure imports

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `apps/web-app/src/infrastructure/trpc/procedures/index.ts` - Current barrel showing re-export mapping
  - `apps/web-app/src/infrastructure/trpc/procedures/auth.ts` - Source for public/protected/admin procedures
  - `apps/web-app/src/infrastructure/trpc/procedures/organization.ts` - Source for organization procedures
  - `apps/web-app/src/infrastructure/trpc/procedures/project-access.ts` - Source for project procedures

  **Acceptance Criteria**:
  ```bash
  # Verify no procedures barrel imports remain
  grep -r 'from "@/infrastructure/trpc/procedures"$' apps/web-app/src --include="*.ts"
  # Expected: No matches
  
  # Verify direct imports exist (spot check)
  grep -c 'from "@/infrastructure/trpc/procedures/auth"' apps/web-app/src/contact/trpc/router.ts
  # Expected: 1
  ```

  **Commit**: NO (groups with Task 4)

---

- [x] 4. Delete barrel files and validate

  **What to do**:
  1. Delete `apps/web-app/src/shared/forms/index.ts`
  2. Delete `apps/web-app/src/shared/layout/index.tsx`
  3. Delete `apps/web-app/src/infrastructure/trpc/procedures/index.ts`
  4. Run `bun run check` to validate all imports resolve
  5. Run `bun run test` to ensure no regressions

  **Must NOT do**:
  - Do NOT delete before all imports are updated (Tasks 1-3 complete)
  - Do NOT delete any files not listed above

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file deletions + validation commands
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (Sequential)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - Tasks 1, 2, 3 acceptance criteria must pass first

  **Acceptance Criteria**:
  ```bash
  # Verify barrel files are deleted
  ls apps/web-app/src/shared/forms/index.ts 2>&1 | grep -c "No such file"
  # Expected: 1
  
  ls apps/web-app/src/shared/layout/index.tsx 2>&1 | grep -c "No such file"
  # Expected: 1
  
  ls apps/web-app/src/infrastructure/trpc/procedures/index.ts 2>&1 | grep -c "No such file"
  # Expected: 1
  
  # Build validation
  bun run check
  # Expected: Exit code 0
  
  # Test validation
  bun run test
  # Expected: All tests pass
  ```

  **Commit**: YES
  - Message: `refactor(imports): remove barrel exports and use direct imports`
  - Files: 
    - 21 modified files (import path changes)
    - 3 deleted files (barrel files)
  - Pre-commit: `bun run check`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 4 | `refactor(imports): remove barrel exports and use direct imports` | 21 modified + 3 deleted | `bun run check && bun run test` |

---

## Success Criteria

### Verification Commands
```bash
# No barrel imports remain
grep -r 'from "@/shared/forms"$' apps/web-app/src --include="*.ts" --include="*.tsx"
grep -r 'from "@/shared/layout"$' apps/web-app/src --include="*.ts" --include="*.tsx"  
grep -r 'from "@/infrastructure/trpc/procedures"$' apps/web-app/src --include="*.ts"
# Expected: No output for all three

# Build passes
bun run check
# Expected: Exit 0

# Tests pass
bun run test
# Expected: All tests pass
```

### Final Checklist
- [x] All 3 barrel files deleted
- [x] All 21 consumer files updated with direct imports
- [x] No barrel import patterns remain in codebase
- [x] Build passes (`bun run check`)
- [x] Tests pass (`bun run test`)
