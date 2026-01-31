---
description: Fix PR review comments from AI assistants, apply changes, respond and push
---

# Fix PR Review Comments

Fetch PR review comments from AI code review assistants, analyze them, apply valid fixes, respond to comments explaining how they were addressed, then commit and push.

## Parameters

- `$1` - PR number (optional, defaults to current branch's PR)

## Instructions

### Step 1: Get PR

**Check State section first** - PR info is already provided there.

If `$1` provided, use that PR number. Otherwise, use current branch's PR from State.

If no PR found, inform the user and exit.

### Step 2: Fetch Review Comments

**Check State section first** - unresolved comments with `threadId`, `commentId`, `path`, `line`, and `body` are already provided there.

If State has unresolved comments, proceed directly to Step 3.

If State shows empty `[]` but you need to verify, fetch fresh data:

```bash
gh api repos/{owner}/{repo}/pulls/<pr_number>/comments
```

If no comments found, wait 2 minutes and retry once. If still no comments, inform the user and exit.

### Step 3: Analyze Each Comment

For each comment:

1. **Read the file** mentioned in the comment at the specific line
2. **Understand the suggestion** - what change is being requested?
3. **Evaluate validity**:
   - **Apply automatically**: Clear improvements (typos, style, obvious bugs, performance)
   - **Apply with judgment**: Suggestions that align with CLAUDE.md conventions
   - **Ask user**: Major architectural changes, unclear suggestions, or potentially breaking changes

### Step 4: Apply Fixes

For each valid suggestion:

1. Make the code change
2. Track what was changed and why

### Step 5: Respond to Comments and Resolve

**For each unresolved comment**, do the following in order:

1. **Reply** to the comment first
2. **Then resolve** the thread (only if addressed or not applicable)

#### 5.1 Get thread IDs for resolving

First, fetch review threads to get thread IDs (needed for resolving later):

```bash
gh api graphql -f query='
  query($owner: String!, $name: String!, $pr: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 1) {
              nodes { id databaseId body }
            }
          }
        }
      }
    }
  }
' -f owner="<owner>" -f name="<repo>" -F pr=<pr_number>
```

Match the comment's `databaseId` with the comment ID from the REST API to find the correct thread.

#### 5.2 Reply to each comment

For inline review comment replies:

```bash
gh api -X POST repos/{owner}/{repo}/pulls/<pr_number>/comments -F body="<response>" -F in_reply_to=<comment_id>
```

For general PR comments:

```bash
gh pr comment <pr_number> --body "<response>"
```

Response format:

- **If fixed**: "Addressed - [brief description of what was changed]"
- **If not applicable**: "Not applicable - [brief explanation why]"
- **If needs discussion**: "Question: [ask for clarification]"

#### 5.3 Resolve the thread

**Only after replying**, resolve the thread:

```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread { id isResolved }
    }
  }
' -f threadId="<thread_node_id>"
```

**Do NOT resolve** threads where you asked a question or need discussion.

### Step 6: Run Validation

```bash
bun run check
```

Fix any new issues introduced by the changes.

### Step 7: Commit and Push

```bash
git add -A && git commit -m "fix(<scope>): <description of changes>" && git push origin HEAD
```

Generate a descriptive commit message based on what was actually changed (e.g., "fix(auth): correct token validation" or "fix(ui): improve error message display").

### Step 8: Monitor Checks and Iterate

After pushing, **automatically enter the monitoring loop**.

Inform the user: "Fixes pushed. Monitoring CI checks... (say 'stop' to exit the loop)"

#### 8.1 Wait for CI checks to complete

Use the built-in `--watch` flag to wait for checks (suppress verbose output):

```bash
gh pr checks <pr_number> --watch --fail-fast > /dev/null 2>&1; echo $?
```

**Exit codes:**
- `0` - All checks passed
- `1` - One or more checks failed

The `--fail-fast` flag exits immediately when any check fails, allowing faster iteration.

#### 8.2 Handle check results

**If exit code is 1 (checks failed):**

1. Get failed check details:
   ```bash
   gh pr checks <pr_number> --json name,state,bucket,link --jq '.[] | select(.bucket == "fail")'
   ```

2. For build/lint/test failures, fetch logs if available or analyze the error from the link
3. Fix the issues locally
4. Run `bun run check` to validate
5. Commit and push the fix:
   ```bash
   git add -A && git commit -m "fix: resolve CI check failures" && git push origin HEAD
   ```
6. **Go back to Step 8.1** to monitor again

**If exit code is 0 (all checks passed):**

1. Check for new review comments since last check:
   ```bash
   gh api repos/{owner}/{repo}/pulls/<pr_number>/comments --jq '[.[] | select(.created_at > "<last_check_timestamp>")] | length'
   ```

2. **If new comments exist:**
   - Inform user: "CI passed but X new review comments found. Processing..."
   - **Go back to Step 2** to process new comments

3. **If no new comments:**
   - Inform user: "All checks passed and no new comments. PR is ready for review! 🎉"
   - Exit the loop

#### 8.3 Loop exit conditions

Exit the monitoring loop when:
- All checks pass AND no new comments
- User says "stop" or requests to exit
- Maximum 5 iterations reached (then ask user to continue)

## Decision Guidelines

**Auto-apply (no user confirmation needed):**

- Typo fixes in comments or strings
- Import organization/cleanup
- Adding missing types
- Style fixes matching CLAUDE.md (kebab-case files, absolute imports, etc.)
- Performance improvements (Promise.all, prefetch patterns)
- Security fixes (removing hardcoded values, adding validation)

**Apply with judgment:**

- Refactoring suggestions that improve code clarity
- Adding error handling
- Improving variable/function names

**Ask user first:**

- Removing functionality
- Changing public API signatures
- Suggestions that contradict existing patterns
- Comments you don't understand or disagree with

## Additional Instructions

$ARGUMENTS

## State

### PR Info
!`gh pr view --json number,url,headRefName,state 2>/dev/null || echo "No PR found for current branch"`

### CI Checks
!`gh pr checks --json name,state,bucket 2>/dev/null | jq -c '[.[] | {name, state, bucket}]' 2>/dev/null || echo "[]"`

### Unresolved Review Comments
!`gh api graphql -f query='query($owner: String!, $name: String!, $pr: Int!) { repository(owner: $owner, name: $name) { pullRequest(number: $pr) { reviewThreads(first: 50) { nodes { id isResolved comments(first: 1) { nodes { databaseId path line body } } } } } } }' -f owner="$(gh repo view --json owner -q .owner.login)" -f name="$(gh repo view --json name -q .name)" -F pr="$(gh pr view --json number -q .number)" 2>/dev/null | jq -c '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | {threadId: .id, commentId: .comments.nodes[0].databaseId, path: .comments.nodes[0].path, line: .comments.nodes[0].line, body: .comments.nodes[0].body}]' 2>/dev/null || echo "[]"`
