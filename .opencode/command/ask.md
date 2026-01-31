---
description: Research and verify before implementing - use CK, Exa, opensrc
---

# Research & Verify

**Question to research:** $ARGUMENTS

Use this command when you need to research something before implementing, or when you're unsure about best practices.

## When to Use

- Before implementing new patterns
- When unsure about best practices for Effect, TanStack, TRPC, Drizzle
- When something doesn't work as expected
- When you need to understand how a library works internally

## Workflow

### 1. CK Semantic Search

Find existing patterns in the codebase:

```
CK semantic_search with path: apps/ or packages/
```

**Important:** Use `apps/` or `packages/` path to avoid searching in `opensrc/` external dependencies.

### 2. opensrc + Read

If you need to understand library internals (not just API/types):

```
Read files from opensrc/repos/github.com/<org>/<repo>/
```

Available sources (see `opensrc/sources.json`):

- Effect, TanStack Router/Query, TRPC, Drizzle ORM
- Better Auth, Base UI, Tailwind docs
- Sentry, Pino, Trigger.dev, and more

To fetch additional source code:

```bash
bunx opensrc <package>           # npm package
bunx opensrc <owner>/<repo>      # GitHub repo
```

### 3. Exa Search

Verify assumptions and check for known issues:

- Search GitHub issues for bugs
- Find articles discussing the problem
- Validate best practices for modern libraries

## Critical Rule

**Don't assume - verify.**

After making claims or assumptions about:

- Best practices
- Library behavior
- Implementation patterns

Use Exa to validate your hypotheses before implementing.

## Examples

**"How should I handle errors in TRPC?"**

1. CK: Find existing error handling in `apps/web-app/src/infrastructure/`
2. opensrc: Read `opensrc/repos/github.com/trpc/trpc/` for internals
3. Exa: Search "TRPC v11 error handling best practices 2024"

**"Why is TanStack Query not caching correctly?"**

1. CK: Find query usage in `apps/`
2. Exa: Search "TanStack Query cache issues github" for known bugs
3. opensrc: Read TanStack Query source if needed

**"Is this Effect pattern correct?"**

1. CK: Find similar patterns in `packages/`
2. opensrc: Read Effect source for understanding
3. Exa: Verify pattern is recommended in Effect community
