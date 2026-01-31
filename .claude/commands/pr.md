---
description: Create branch, commit, push and open PR
allowed-tools: Bash(git:*), Bash(gh:*)
argument-hint: [base-branch] [additional instructions]
---

# Create or Update Pull Request

Create branch (if needed), commit, push, and create/update PR in one command.

## Instructions

Run everything as ONE chained command so user approves only once:

```bash
git checkout -b <branch> && git add -A && git commit -m "<msg>" && git push -u origin HEAD && gh pr create --base <base> --title "<title>" --body "<body>"
```

- If already on feature branch, skip `git checkout -b`
- Check if PR exists: `gh pr view --json number -q .number 2>/dev/null`
- If PR exists, use `gh pr edit <pr_number> --title "<title>" --body "<body>"` instead of `gh pr create`
- Base branch: `$1` (default: `test`)
- Branch naming: `feat/`, `fix/`, `chore/` based on changes

### Step X: Monitor Checks and Iterate

After pushing, **automatically enter the monitoring loop**.

Inform the user: "PR created. Monitoring CI checks... (say 'stop' to exit the loop)"

#### Wait for CI checks to complete

Poll check status every 30 seconds:

```bash
gh pr checks <pr_number> --watch
```

Or manually poll:

```bash
gh pr checks <pr_number> --json name,state,conclusion
```

States: `PENDING`, `QUEUED` → still running. `COMPLETED` → check conclusion.

#### Handle check results

**If any check fails:**

1. Get the failed check details:
   ```bash
   gh pr checks <pr_number> --json name,state,conclusion,detailsUrl
   ```

2. For build/lint/test failures, fetch logs if available or analyze the error
3. Fix the issues locally
4. Run validation command (e.g., `bun run check`)
5. Commit and push the fix
6. **Go back to monitoring** to check again

**If all checks pass:**
- Inform user: "All checks passed. PR is ready for review! 🎉"
- Exit the loop

#### Loop exit conditions

Exit the monitoring loop when:
- All checks pass
- User says "stop" or requests to exit
- Maximum 5 iterations reached (then ask user to continue)

## PR Body Format

```
## Summary
<1-2 sentences>

## Changes
- <bullet list>
```

## Additional Instructions

$ARGUMENTS

## State

!`git status --short && git branch --show-current && git log $1..HEAD --oneline 2>/dev/null || git log test..HEAD --oneline`
