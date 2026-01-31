# Effect Parallel Patterns

## Basic Parallel Execution

### Effect.all - Parallel Array Processing
```typescript
// All effects run in parallel, collect all results
const results = yield* Effect.all([
  fetchUserEffect,
  fetchProjectsEffect,
  fetchSettingsEffect,
]);
// results is a tuple: [user, projects, settings]
```

### Effect.all with Array.map
```typescript
// Process array of items in parallel
const processedItems = yield* Effect.all(
  items.map((item) => processItemEffect(item))
);
```

### Bounded Concurrency
```typescript
// Limit concurrent operations (e.g., for rate-limited APIs)
const results = yield* Effect.all(
  items.map((item) => callApiEffect(item)),
  { concurrency: 10 }  // Max 10 concurrent
);
```

## Error Handling in Parallel

### Fail Fast (Default)
```typescript
// If any effect fails, entire Effect.all fails immediately
const results = yield* Effect.all([a, b, c]);
```

### Collect All Errors
```typescript
// Collect results and errors separately
const results = yield* Effect.all(
  items.map((item) => 
    processItem(item).pipe(
      Effect.either  // Converts to Either<Error, Success>
    )
  )
);

// results is Array<Either<Error, Success>>
const successes = results.filter(Either.isRight).map(e => e.right);
const failures = results.filter(Either.isLeft).map(e => e.left);
```

### Continue on Individual Errors
```typescript
// Use catchAll to convert errors to fallback values
const results = yield* Effect.all(
  items.map((item) =>
    processItem(item).pipe(
      Effect.catchAll((error) => {
        logger.warn({ item, error }, "Failed to process item");
        return Effect.succeed(null);  // Fallback value
      })
    )
  )
);
```

## Common Vivus Patterns

### Parallel Data Fetching
```typescript
const collectAllNamespaceMetrics = Effect.fn(
  "K8sMetrics.collectAllNamespaceMetrics"
)(function* (params: { credentials: K8sCredentials; targetNamespaces: string[] }) {
  const { credentials, targetNamespaces } = params;

  // Parallel cluster-wide API calls
  const [allPodsResult, allMetricsResult] = yield* Effect.all([
    listAllPods(httpClient, credentials).pipe(
      Effect.mapError((error) => K8sMetricsError.make({...}))
    ),
    listAllPodMetrics(httpClient, credentials).pipe(
      Effect.map((result) => result.items),
      Effect.catchTag("K8sHttpError", () => Effect.succeed([]))
    ),
  ]);

  // Process results locally
  return groupByNamespace(allPodsResult, allMetricsResult, targetNamespaces);
});
```

### Parallel with Logging
```typescript
const processIssues = Effect.fn("Issues.process")(function* (issues: Issue[]) {
  const results = yield* Effect.all(
    issues.map((issue) =>
      processIssue(issue).pipe(
        Effect.tap(() => 
          Effect.log(`Processed issue ${issue.id}`)
        ),
        Effect.catchAll((error) =>
          Effect.logWarning(`Failed to process issue ${issue.id}: ${error.message}`).pipe(
            Effect.as({ success: false, issue, error })
          )
        ),
        Effect.map(() => ({ success: true, issue }))
      )
    ),
    { concurrency: 10 }
  );

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  yield* Effect.log(`Processed ${succeeded} issues, ${failed} failed`);

  return results;
});
```

### Sequential Dependent Operations
```typescript
// When operations depend on each other, use sequential yield*
const user = yield* fetchUser(userId);
const permissions = yield* fetchPermissions(user.roleId);  // Depends on user
const dashboard = yield* buildDashboard(user, permissions);  // Depends on both
```

### Mixed Parallel and Sequential
```typescript
// Fetch independent data in parallel
const [user, settings] = yield* Effect.all([
  fetchUser(userId),
  fetchSettings(userId),
]);

// Then use results sequentially
const permissions = yield* fetchPermissions(user.roleId);

// More parallel operations using previous results
const [projects, notifications] = yield* Effect.all([
  fetchProjects(user.organizationId),
  fetchNotifications(user.id, settings.notificationPrefs),
]);
```

## Performance Tips

### Avoid Nested Effect.all
```typescript
// Bad: Creates unnecessary nesting
const results = yield* Effect.all(
  items.map((item) =>
    Effect.all([
      fetchA(item),
      fetchB(item),
    ])
  )
);

// Better: Flatten the structure
const results = yield* Effect.all(
  items.flatMap((item) => [
    fetchA(item).pipe(Effect.map(a => ({ item, type: 'a', data: a }))),
    fetchB(item).pipe(Effect.map(b => ({ item, type: 'b', data: b }))),
  ]),
  { concurrency: 20 }
);
```

### Use Appropriate Concurrency
```typescript
// External APIs (rate limited): 3-10
{ concurrency: 5 }

// K8s API: 10-20
{ concurrency: 20 }

// Database operations: 10-50
{ concurrency: 20 }

// In-memory operations: unbounded (default)
// Just use Effect.all without concurrency option
```
