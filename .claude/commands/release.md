---
description: Create a new version tag and GitHub release using changesets
allowed-tools: Bash(git:*), Bash(gh:*), Bash(bunx:*)
argument-hint: [patch|minor|major]
---

# Create Release

Create a new version tag and GitHub release using changesets workflow.

## Instructions

### Step 1: Check Changesets Status

```bash
bunx changeset status
ls .changeset/*.md 2>/dev/null | grep -v README.md | head -10
```

### Step 2: Handle Changesets

**If changesets exist (files in `.changeset/` besides README.md):**

1. Show pending changesets to user
2. Run `bunx changeset version` to:
   - Consume changeset files
   - Update package versions
   - Generate/update CHANGELOG.md files
3. Commit the version bump: `git add -A && git commit -m "chore: version packages"`

**If NO changesets exist:**

Ask user: "No changesets found. Options:"
- Create changeset now (`bunx changeset` - but we can't run interactive, so create manually)
- Skip changesets and proceed with manual versioning (fallback to commit-based detection)

### Step 3: Determine Version

**If changesets were applied:** Extract version from root `package.json` or use the highest bumped version.

**If manual versioning:** Analyze commits since last tag:
- `BREAKING CHANGE:` or `!:` → **major**
- `feat:` → **minor**  
- `fix:`, `chore:`, `docs:`, etc. → **patch**

If `$ARGUMENTS` specifies version type (patch/minor/major), use that override.

### Step 4: Calculate Next Version

Get last tag and increment:
```bash
git tag --sort=-v:refname | head -1
```

- major: `v0.1.2` → `v1.0.0`
- minor: `v0.1.2` → `v0.2.0`
- patch: `v0.1.2` → `v0.1.3`

### Step 5: Show Preview and Confirm

Display:
```
Last tag: v0.1.2
Changesets: [list or "none"]
Commits since last tag:
- feat: ...
- fix: ...

Suggested version: v0.2.0 (minor)

Proceed? (y/n)
```

Wait for user confirmation. User can also override version (e.g., type "patch" to force patch).

### Step 6: Create Tag and Push

```bash
git tag -a v<version> -m "v<version>"
git push origin v<version>
```

If there are uncommitted changes from changeset version, commit first:
```bash
git add -A && git commit -m "chore: release v<version>" && git push origin HEAD
```

### Step 7: Create GitHub Release

Generate release notes. If CHANGELOG.md was updated by changesets, extract the latest section. Otherwise, generate from commits:

```bash
gh release create v<version> --title "v<version>" --notes "<notes>"
```

**Notes format:**
```markdown
## What's Changed

### Features
- feat commits...

### Bug Fixes  
- fix commits...

### Other Changes
- chore, docs, refactor commits...

**Full Changelog**: https://github.com/OWNER/REPO/compare/<last-tag>...v<version>
```

### Step 8: Report Success

Show:
- Tag created
- GitHub Release URL
- Remind about `bunx changeset publish` if npm publishing is needed

## Arguments

$ARGUMENTS

- `patch` - Force patch release (x.x.X)
- `minor` - Force minor release (x.X.0)  
- `major` - Force major release (X.0.0)
- Empty - Auto-detect from changesets or commits

## State

!`echo "=== Tags ===" && git tag --sort=-v:refname | head -5 && echo "" && echo "=== Changesets ===" && ls .changeset/*.md 2>/dev/null | grep -v README || echo "No changesets" && echo "" && echo "=== Commits since last tag ===" && git log $(git tag --sort=-v:refname | head -1)..HEAD --oneline 2>/dev/null || echo "No tags yet"`
