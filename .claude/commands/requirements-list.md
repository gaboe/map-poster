---
description: Display all requirements with their status and summaries
argument-hint: [filter or additional instructions]
---

# List All Requirements

$ARGUMENTS

Display all requirements with their status and summaries.

## Instructions

1. Check `requirements/.current-requirement` for active requirement
2. List all folders in `requirements/` directory
3. For each requirement folder:
   - Read `metadata.json`
   - Extract key information
   - Format for display

4. Sort by:
   - Active first (if any)
   - Then by status: complete, incomplete
   - Then by date (newest first)

## Display Format

```
Requirements Documentation

--- ACTIVE ---

[name]
   Phase: Discovery (3/5) | Started: 30m ago
   Request: [first line of 00-initial-request.md]
   Next: Continue with /requirements-status

--- COMPLETE ---

2025-01-26-0900-dark-mode-toggle
   Status: Ready for implementation
   Questions answered: 10
   Summary: [first line of spec overview]
   Spec: requirements/2025-01-26-0900-dark-mode-toggle/06-requirements-spec.md

2025-01-25-1400-export-reports
   Status: Implemented
   Questions answered: 10
   Summary: PDF/CSV export with filtering

--- INCOMPLETE ---

2025-01-24-1100-notification-system
   Status: Paused at Detail phase (2/5)
   Last activity: 2 days ago
   Resume: /requirements-status

--- STATISTICS ---

Total: 4 requirements
- Complete: 2
- Active: 1
- Incomplete: 1
```

## Additional Features

### Show linked artifacts

For complete requirements, check if there are:

- Related git branches
- Pull requests (search git log for requirement name)
- Implementation status

### Highlight stale requirements

Mark if incomplete > 7 days:

```
2025-01-15-old-feature (STALE - 8 days)
   Consider: Resume or cancel with /requirements-end
```

### Quick actions

```
Quick Actions:
- View active detail: /requirements-current
- Resume incomplete: /requirements-status
- Start new: /requirements-start [description]
- End/cancel active: /requirements-end
```

## Empty State

If no requirements exist:

```
No requirements found.

Start gathering requirements for a new feature:
/requirements-start [feature description]

Example:
/requirements-start add dark mode toggle to settings
```
