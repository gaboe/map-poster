# Database Access for Coding Agents

Guide for database access across all environments (local, test, prod) using the unified `db-tool.ts` script.

## Overview

| Environment | User                          | Database     | Access     | Tunnel |
| ----------- | ----------------------------- | ------------ | ---------- | ------ |
| LOCAL       | blogic-user                   | blogic       | Read/Write | No     |
| TEST        | coding-agent-test-readonly    | blogic-test  | Read-only  | Auto   |
| PROD        | coding-agent-prod-readonly    | blogic-prod  | Read-only  | Auto   |

## Architecture

```
+------------------+     +------------------+     +-----------------+
|  Coding Agent    |---->|  db-tool.ts      |---->|  PostgreSQL     |
|  (Claude, etc)   |     |  (unified        |     |                 |
|                  |     |   interface)     |     |                 |
+------------------+     +------------------+     +-----------------+
```

**For LOCAL:** Direct connection to localhost:25432 (no tunnel)
**For TEST/PROD:** Auto kubectl port-forward tunnel per request

## Setup

Before using this tool for TEST/PROD environments, you need to:

1. **Configure kubectl settings** in `tools/db-tool.ts`:
   ```typescript
   const KUBECTL_CONTEXT = "your-kubectl-context";  // Replace with actual context
   const KUBECTL_NAMESPACE = "your-namespace";       // Replace with actual namespace
   ```

2. **Create readonly users** in the database (see "Creating a New Read-Only User" below)

3. **Set environment variables** in `~/.zshrc`

## Usage

```bash
# Show help with full usage documentation
bun run tools/db-tool.ts --help

# Query LOCAL database (~50ms)
bun run tools/db-tool.ts --env local --sql "SELECT * FROM users LIMIT 5"

# Query TEST database (~500ms)
bun run tools/db-tool.ts --env test --sql "SELECT * FROM users LIMIT 5"

# Query PROD database (~500ms)
bun run tools/db-tool.ts --env prod --sql "SELECT count(*) FROM projects"
```

### Output Format

```json
{
  "success": true,
  "data": [{ "id": "...", "name": "..." }],
  "rowCount": 5,
  "executionTimeMs": 512
}
```

### Error Output

```json
{
  "success": false,
  "error": "relation \"nonexistent\" does not exist",
  "executionTimeMs": 450
}
```

## Schema Introspection

Before writing SQL queries, use schema introspection to discover available tables and columns.

```bash
# List all tables
bun run tools/db-tool.ts --env local --schema tables

# Show columns for a specific table
bun run tools/db-tool.ts --env local --schema columns --table users

# Get full schema (all tables with columns)
bun run tools/db-tool.ts --env local --schema full

# View foreign key relationships
bun run tools/db-tool.ts --env local --schema relationships
```

### Schema Introspection Output

```json
{
  "success": true,
  "data": [
    { "name": "accounts" },
    { "name": "members" },
    { "name": "organizations" },
    { "name": "projects" },
    { "name": "users" }
  ],
  "rowCount": 5,
  "message": "Schema introspection: tables",
  "executionTimeMs": 45
}
```

### Column Details Output

```json
{
  "success": true,
  "data": [
    { "name": "id", "type": "text", "nullable": false, "is_primary_key": true },
    { "name": "email", "type": "text", "nullable": false, "is_primary_key": false },
    { "name": "name", "type": "text", "nullable": true, "is_primary_key": false }
  ],
  "rowCount": 3,
  "message": "Schema introspection: columns for table 'users'",
  "executionTimeMs": 52
}
```

## Environment Variables

Required in `~/.zshrc`:

```bash
export BLOGIC_CODING_AGENT_DB_TEST_PWD="<test-password>"
export BLOGIC_CODING_AGENT_DB_PROD_PWD="<prod-password>"
```

## Creating a New Read-Only User

### Prerequisites

- kubectl access to your Kubernetes cluster
- PostgreSQL superuser access (postgres)

### Steps

1. **Generate a strong password**

```bash
openssl rand -base64 24 | tr -d '/+=' | head -c 32
```

2. **Connect to PostgreSQL**

```bash
kubectl exec -n <namespace> postgresql-0 --context <context> -- psql -U postgres -d <database>
```

3. **Create the user and configure permissions**

```sql
-- Create readonly group (if not exists)
CREATE ROLE "grp_blogic-<env>_readonly" WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT;

-- Configure the readonly group permissions (public schema - always exists)
GRANT USAGE ON SCHEMA public TO "grp_blogic-<env>_readonly";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "grp_blogic-<env>_readonly";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "grp_blogic-<env>_readonly";

-- Configure drizzle schema (only if it exists - check with \dn first)
-- GRANT USAGE ON SCHEMA drizzle TO "grp_blogic-<env>_readonly";
-- GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO "grp_blogic-<env>_readonly";
-- ALTER DEFAULT PRIVILEGES IN SCHEMA drizzle GRANT SELECT ON TABLES TO "grp_blogic-<env>_readonly";

-- Create user with password
CREATE USER "coding-agent-<env>-readonly" WITH PASSWORD '<password>';

-- Grant group membership to user
GRANT "grp_blogic-<env>_readonly" TO "coding-agent-<env>-readonly";
```

> **Note:** The `drizzle` schema is created by Drizzle ORM migrations. If it doesn't exist yet, skip those grants.

4. **Add password to environment variables**

```bash
# In ~/.zshrc
export BLOGIC_CODING_AGENT_DB_<ENV>_PWD="<password>"
```

5. **Reload shell**

```bash
source ~/.zshrc
```

## Security Notes

- Users have **SELECT-only** access via readonly group membership
- No INSERT/UPDATE/DELETE/DDL permissions
- Separate users per environment for credential isolation
- Passwords stored in local environment variables (not in repo)
- Tunnel is opened per-request and immediately closed after query

## Troubleshooting

### "KUBECTL_CONTEXT and KUBECTL_NAMESPACE must be configured"

You need to update the kubectl configuration in `tools/db-tool.ts` with your actual cluster details.

### "Environment variable not set"

Ensure the password is exported in your shell:

```bash
source ~/.zshrc
echo $BLOGIC_CODING_AGENT_DB_TEST_PWD
```

### "Tunnel failed to open"

Check kubectl context and connectivity:

```bash
kubectl config current-context
kubectl get pods -n <namespace> --context <context>
```

### "Permission denied for table"

Verify group membership and re-apply grants:

```sql
-- Check group membership
SELECT r.rolname as user, r2.rolname as member_of 
FROM pg_catalog.pg_roles r 
JOIN pg_catalog.pg_auth_members m ON r.oid = m.member 
JOIN pg_catalog.pg_roles r2 ON m.roleid = r2.oid 
WHERE r.rolname LIKE '%coding-agent%';

-- Re-apply grants if needed (run as postgres user)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "grp_blogic-<env>_readonly";
```

### "schema drizzle does not exist"

The `drizzle` schema is created by Drizzle ORM when migrations run. If it doesn't exist yet, simply skip the drizzle-related grants.
