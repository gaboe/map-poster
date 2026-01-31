---
description: "Create new branch from base (default: test) with staged/unstaged changes"
---

# Create New Branch

Create a new feature branch from base, preserving current changes.

## Parameters

- `$1` - Base branch (default: `test`)

## Instructions

**If there are uncommitted changes:**

```bash
git stash && git checkout <base> && git pull origin <base> && git checkout -b <branch-name> && git stash pop
```

Note: `git stash pop` is safe - if conflicts occur during apply, Git automatically keeps the stash entry for manual recovery.

**If working tree is clean:**

```bash
git checkout <base> && git pull origin <base> && git checkout -b <branch-name>
```

- Base branch: `$1` or `test` if not provided
- Branch naming: `feat/`, `fix/`, `chore/` based on changes
- Infer branch name from changes or ask user

## Additional Instructions

$ARGUMENTS

## State

!`git status --short && git branch --show-current`
