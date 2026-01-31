---
description: Commit and push to current branch
---

# Commit and Push

Commit all changes and push to current branch in one command.

## Instructions

Run everything as ONE chained command so user approves only once:

```bash
git add -A && git commit -m "<msg>" && git push origin HEAD
```

- Commit message: conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- If no changes, skip

## Additional Instructions

$ARGUMENTS

## State

!`git status --short && git branch --show-current && git log --oneline -3`
