# @map-poster/services

Effect.ts services package for map-poster application - provides type-safe, composable business logic services with dependency injection.

## 📁 Architecture

This package follows Effect.ts best practices with clear separation between service definitions, implementations, and data models:

```
src/
├── context/               # Effect Context Tags (Database, ApiClient)
├── errors/                # Global error types
├── servers/               # Server-related business logic
│   ├── services/          # Service definitions (Context.Tags)
│   ├── layers/           # Service implementations (Layers)
│   ├── models/           # Data types & models
│   └── errors.ts         # Domain-specific errors
└── index.ts              # Main exports
```

## 🏗️ Core Concepts

### Services vs Layers

**Services** (`Context.Tag`) define **what** you need:

```typescript
// services/server-sync.ts
export class ServerSyncService extends Context.Tag(
  "ServerSyncService"
)<
  ServerSyncService,
  {
    readonly syncProjectServers: (
      projectId: string
    ) => Effect.Effect<SyncProjectResult, SyncError>;
    readonly fetchServerToolsCached: (
      serverId: string
    ) => Effect.Effect<ServerTool[], ServerFetchError>;
  }
>() {}
```

**Layers** (`Layer`) define **how** to implement it:

```typescript
// layers/server-sync-live.ts
export const ServerSyncServiceLive = Layer.effect(
  ServerSyncService,
  Effect.gen(function* () {
    const db = yield* Database; // Dependencies injected automatically
    const apiClient = yield* ApiClient;

    return {
      syncProjectServers: (projectId) =>
        Effect.gen(function* () {
          // Real implementation logic here...
        }),
      fetchServerToolsCached: (serverId) =>
        Effect.gen(function* () {
          // Real implementation logic here...
        }),
    };
  })
);
```

### Why This Separation?

1. **🧪 Testing**: Create `MockServerSyncService` layers for tests
2. **🔄 Flexibility**: Switch implementations (prod/dev/test) easily
3. **🎯 Dependency Injection**: Layers manage dependencies automatically
4. **📝 Clean Code**: Service interfaces are clear, without implementation details
5. **🏗️ Composability**: Combine multiple layers effortlessly

## 🚀 Usage

### In Application Code

```typescript
// Use the Service (not Layer directly)
const syncProgram = Effect.gen(function* () {
  const syncService = yield* ServerSyncService; // Request service
  return yield* syncService.syncProjectServers(
    "project-id"
  );
});

// Provide implementation via Layer
const runnable = syncProgram.pipe(
  Effect.provide(ServerSyncServiceLive) // Provide implementation
);

// Execute
Effect.runPromise(runnable);
```

### In TRPC Routers

```typescript
// apps/web-app/src/projects/trpc/project.ts
const syncProgram = Effect.gen(function* () {
  const syncService = yield* ServerSyncService;
  return yield* syncService.syncNewProject(
    projectId,
    organizationId
  );
}).pipe(Effect.provide(ServicesLive));

Effect.runPromise(syncProgram);
```

### Setting Up Layers

```typescript
// apps/web-app/src/infrastructure/layers.ts
const DatabaseLive = Layer.succeed(Database, db);
const ApiClientLive = Layer.succeed(ApiClient, {
  baseUrl: env.BASE_URL,
});

export const ServicesLive = Layer.provideMerge(
  ServerSyncServiceLive,
  Layer.merge(DatabaseLive, ApiClientLive)
);
```

## 📦 Directory Structure Explained

### `context/`

Global Effect Context Tags for shared resources:

- `Database` - Database connection context
- `ApiClient` - HTTP client configuration context

### `servers/services/`

Service definitions using `Context.Tag`:

- Defines **interfaces** for business operations
- No implementation details
- Type-safe method signatures

### `servers/layers/`

Service implementations using `Layer.effect`:

- Contains **actual business logic**
- Manages dependencies (Database, ApiClient, etc.)
- Can have multiple implementations (Live, Mock, Test)

### `servers/models/`

Data types and models:

- `SyncProjectResult` - Result types for sync operations
- `ServerTool` - Domain models
- Pure TypeScript types, no Effect dependencies

### `servers/errors.ts`

Domain-specific error types using `Schema.TaggedError`:

- `SyncError` - General sync operation failures
- `ServerFetchError` - Server API communication errors

## 🔧 Development Guidelines

1. **Service First**: Always define the service interface before implementation
2. **Pure Models**: Keep data types in `models/` free from Effect dependencies
3. **Error Handling**: Use `Schema.TaggedError` for type-safe error handling
4. **Dependencies**: Declare all dependencies in Layer, not in Service interface
5. **Testing**: Create separate layers for testing with mock implementations

## 📚 Effect.ts Resources

- [Services Documentation](https://effect.website/docs/requirements-management/services/)
- [Layers Documentation](https://effect.website/docs/requirements-management/layers/)
- [Error Handling](https://effect.website/docs/error-management/expected-errors/)
- [Dependency Injection](https://effect.website/docs/requirements-management/default-services/)
