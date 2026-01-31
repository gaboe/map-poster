---
description: Show current requirement gathering progress and continue from last question
argument-hint: [additional instructions]
---

# Check Requirements Status

$ARGUMENTS

Show current requirement gathering progress and continue.

## Instructions

1. Read `requirements/.current-requirement`

2. **If no active requirement:**

   ```
   No active requirement gathering session.

   Options:
   - Start new: /requirements-start [description]
   - List all: /requirements-list
   ```

3. **If active requirement exists:**
   - Read `metadata.json` for current phase and progress
   - Show formatted status
   - Load appropriate question/answer files
   - Continue from last unanswered question

## Status Display Format

```
Active Requirement: [name]
Started: [time ago]
Phase: [Discovery/Context/Detail/Complete]
Progress: [X/Y] questions answered

--- Recent Progress ---

[Show last 3 answered questions with responses]

--- Next Question ---

[Show next unanswered question with default]

Type 'yes', 'no', or 'idk' (uses default)
```

## Continuation Flow

1. Read next unanswered question from file:
   - Phase 2: `01-discovery-questions.md`
   - Phase 4: `04-detail-questions.md`

2. Present to user with default

3. Accept response:
   - `yes` / `y` - Affirmative
   - `no` / `n` - Negative
   - `idk` / `default` / `d` - Use default value

4. **DO NOT record answer yet** - wait until ALL questions in phase are asked

5. After ALL questions answered:
   - Update answer file (`02-discovery-answers.md` or `05-detail-answers.md`)
   - Update `metadata.json` progress

6. Move to next question or phase

## Phase Transitions

**Discovery (Phase 2) -> Context (Phase 3):**

- All 5 discovery questions answered
- Record answers in `02-discovery-answers.md`
- Run autonomous context gathering (no user interaction)
- Create `03-context-findings.md`

**Context (Phase 3) -> Detail (Phase 4):**

- Context findings documented
- Generate expert questions based on findings
- Write to `04-detail-questions.md`
- Begin asking detail questions

**Detail (Phase 4) -> Complete (Phase 5):**

- All detail questions answered
- Record answers in `05-detail-answers.md`
- Generate final spec in `06-requirements-spec.md`
- Update status to "complete"
- Clear `.current-requirement`

## Quick Actions

```
Continue: Just respond to the question
Skip phase: /requirements-end (generates spec with current info)
View all: /requirements-current
List all: /requirements-list
```
