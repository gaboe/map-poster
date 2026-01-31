/**
 * Database Query Tool for Coding Agents
 *
 * Executes SQL queries against local, TEST, or PROD databases.
 * Supports schema introspection to discover tables, columns, and relationships.
 *
 * Run with --help for full usage documentation.
 *
 * Documentation: tools/database-readonly-users.md
 *
 * IMPORTANT FOR AI AGENTS:
 * Always use --schema to introspect before writing SQL queries!
 * Never guess table/column names - discover them first.
 *
 * OUTPUT FORMAT:
 * Default is TOON (LLM-optimized, ~40% fewer tokens).
 * Use --format json for standard JSON output.
 */

import { encode as encodeToon } from "@toon-format/toon";

type Environment = "local" | "test" | "prod";
type OutputFormat = "json" | "toon";
type SchemaMode =
  | "tables"
  | "columns"
  | "full"
  | "relationships";

type ParsedArgs =
  | { mode: "help" }
  | {
      mode: "sql";
      env: Environment;
      sql: string;
      format: OutputFormat;
    }
  | {
      mode: "schema";
      env: Environment;
      schema: SchemaMode;
      table?: string;
      format: OutputFormat;
    };

type QueryResult = {
  success: boolean;
  data?: Record<string, unknown>[];
  message?: string;
  error?: string;
  rowCount?: number;
  executionTimeMs: number;
  availableTables?: string[];
  availableColumns?: string[];
  hint?: string;
  schemaFile?: string;
};

type DbConfig = {
  user: string;
  database: string;
  password?: string;
  passwordEnvVar?: string;
  port: number;
  needsTunnel: boolean;
  allowMutations: boolean;
};

/**
 * Database connection configurations for each environment.
 * Update these values for your specific project setup.
 */
const DB_CONFIGS: Record<Environment, DbConfig> = {
  local: {
    user: "map-poster-user",
    database: "map-poster",
    password: "pwd123",
    port: 25540,
    needsTunnel: false,
    allowMutations: true,
  },
  test: {
    user: "coding-agent-test-readonly",
    database: "blogic-test",
    passwordEnvVar: "BLOGIC_CODING_AGENT_DB_TEST_PWD",
    port: 25437,
    needsTunnel: true,
    allowMutations: false,
  },
  prod: {
    user: "coding-agent-prod-readonly",
    database: "blogic-prod",
    passwordEnvVar: "BLOGIC_CODING_AGENT_DB_PROD_PWD",
    port: 25438,
    needsTunnel: true,
    allowMutations: false,
  },
};

/**
 * Kubernetes configuration for port-forward tunnels.
 * Update these values for your specific Kubernetes setup.
 */
const KUBECTL_CONTEXT = "your-kubectl-context";
const KUBECTL_NAMESPACE = "your-namespace";
const REMOTE_PORT = 5432;
const TUNNEL_TIMEOUT_MS = 5000;
const TUNNEL_CHECK_INTERVAL_MS = 100;

/**
 * Help text for --help flag.
 */
const HELP_TEXT = `
Database Query Tool for Coding Agents

USAGE:
  bun run tools/db-tool.ts --help
  bun run tools/db-tool.ts --env <local|test|prod> --sql "<query>"
  bun run tools/db-tool.ts --env <local|test|prod> --schema <mode> [--table <name>]

OPTIONS:
  --help                 Show this help message
  --env <environment>    Target database: local, test, or prod
  --sql "<query>"        SQL query to execute
  --schema <mode>        Introspect schema (see modes below)
  --table <name>         Table name (required for --schema columns)
  --format <json|toon>   Output format (default: toon). Use 'json' for standard JSON output

SCHEMA MODES:
  tables                 List all table names
  columns                Show columns for --table <name> (requires --table)
  full                   All tables with their columns
  relationships          Foreign key relationships between tables

WORKFLOW FOR AI AGENTS:
  1. ALWAYS start by discovering the schema:
     bun run tools/db-tool.ts --env local --schema tables

  2. Check columns of relevant tables:
     bun run tools/db-tool.ts --env local --schema columns --table users

  3. View relationships if needed:
     bun run tools/db-tool.ts --env local --schema relationships

  4. NOW write your SQL query:
     bun run tools/db-tool.ts --env local --sql "SELECT id, name FROM users LIMIT 5"

  NEVER guess table/column names - always introspect first!

ENVIRONMENTS:
  local    Read/Write access, direct connection (development only)
  test     Read-only access, auto kubectl tunnel (test environment)
  prod     Read-only access, auto kubectl tunnel (production - BE CAREFUL!)

EXAMPLES:
  # List all tables
  bun run tools/db-tool.ts --env local --schema tables

  # Show columns for 'users' table
  bun run tools/db-tool.ts --env local --schema columns --table users

  # Get full schema (all tables with columns)
  bun run tools/db-tool.ts --env local --schema full

  # View foreign key relationships
  bun run tools/db-tool.ts --env local --schema relationships

  # Execute SELECT query
  bun run tools/db-tool.ts --env local --sql "SELECT id, name, email FROM users LIMIT 5"

  # Execute mutation (local only)
  bun run tools/db-tool.ts --env local --sql "UPDATE users SET name = 'test' WHERE id = '123'"

OUTPUT:
  TOON: Token-efficient format (~40% fewer tokens for uniform arrays) - DEFAULT
  JSON: { success, data?, error?, rowCount?, executionTimeMs }

DOCUMENTATION:
  See tools/database-readonly-users.md for full documentation.
`.trim();

/**
 * SQL queries for schema introspection.
 */
const SCHEMA_QUERIES = {
  tables: `
    SELECT tablename as name
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `,
  columns: (tableName: string) => `
    SELECT
      c.column_name as name,
      c.data_type as type,
      c.is_nullable = 'YES' as nullable,
      c.column_default as default_value,
      COALESCE(
        (SELECT true FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_name = c.table_name
         AND tc.table_schema = c.table_schema
         AND kcu.column_name = c.column_name
         AND tc.constraint_type = 'PRIMARY KEY'),
        false
      ) as is_primary_key
    FROM information_schema.columns c
    WHERE c.table_name = '${tableName}'
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position
  `,
  relationships: `
    SELECT
      tc.table_name as from_table,
      kcu.column_name as from_column,
      ccu.table_name as to_table,
      ccu.column_name as to_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `,
};

function validateKubectlConfig(): void {
  if (
    KUBECTL_CONTEXT === "your-kubectl-context" ||
    KUBECTL_NAMESPACE === "your-namespace"
  ) {
    throw new Error(
      "KUBECTL_CONTEXT and KUBECTL_NAMESPACE must be configured in tools/db-tool.ts before using test/prod environments"
    );
  }
}

// Cache for zshrc env vars (loaded once)
let zshrcEnvCache: Record<string, string> | null = null;

/**
 * Load BLOGIC_* environment variables from ~/.zshrc as fallback.
 * Only parses export statements for BLOGIC_ prefixed variables.
 */
async function loadEnvFromZshrc(): Promise<
  Record<string, string>
> {
  if (zshrcEnvCache !== null) {
    return zshrcEnvCache;
  }

  const zshrcPath = `${process.env.HOME}/.zshrc`;

  try {
    const file = Bun.file(zshrcPath);
    if (!(await file.exists())) {
      zshrcEnvCache = {};
      return zshrcEnvCache;
    }

    const content = await file.text();
    const envVars: Record<string, string> = {};

    // Match: export BLOGIC_CODING_AGENT_DB_TEST_PWD="value"
    // or:    export BLOGIC_CODING_AGENT_DB_TEST_PWD='value'
    // or:    export BLOGIC_CODING_AGENT_DB_TEST_PWD=value
    const regex =
      /^export\s+(BLOGIC_[A-Z_]+)=["']?([^"'\n]+)["']?/gm;
    let match;

    while ((match = regex.exec(content)) !== null) {
      envVars[match[1]] = match[2];
    }

    zshrcEnvCache = envVars;
    return zshrcEnvCache;
  } catch {
    zshrcEnvCache = {};
    return zshrcEnvCache;
  }
}

// Patterns to detect mutation queries
const MUTATION_PATTERNS = [
  /^\s*UPDATE\s+/i,
  /^\s*INSERT\s+/i,
  /^\s*DELETE\s+/i,
  /^\s*TRUNCATE\s+/i,
  /^\s*DROP\s+/i,
  /^\s*ALTER\s+/i,
  /^\s*CREATE\s+/i,
];

function isMutationQuery(sql: string): boolean {
  return MUTATION_PATTERNS.some((pattern) =>
    pattern.test(sql)
  );
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  // Check for --help first
  if (
    args.includes("--help") ||
    args.includes("-h") ||
    args.length === 0
  ) {
    return { mode: "help" };
  }

  let env: string | undefined;
  let sql: string | undefined;
  let schema: string | undefined;
  let table: string | undefined;
  let format: OutputFormat = "toon";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--env" && args[i + 1]) {
      env = args[i + 1];
      i++;
    } else if (args[i] === "--sql" && args[i + 1]) {
      sql = args[i + 1];
      i++;
    } else if (args[i] === "--schema" && args[i + 1]) {
      schema = args[i + 1];
      i++;
    } else if (args[i] === "--table" && args[i + 1]) {
      table = args[i + 1];
      i++;
    } else if (args[i] === "--format" && args[i + 1]) {
      const f = args[i + 1];
      if (f === "json" || f === "toon") {
        format = f;
      }
      i++;
    }
  }

  // Validate environment
  if (!env || !["local", "test", "prod"].includes(env)) {
    console.error(
      JSON.stringify({
        success: false,
        error:
          "Invalid or missing --env. Must be 'local', 'test', or 'prod'. Run --help for usage.",
        executionTimeMs: 0,
      })
    );
    process.exit(1);
  }

  // Schema mode
  if (schema) {
    if (
      ![
        "tables",
        "columns",
        "full",
        "relationships",
      ].includes(schema)
    ) {
      console.error(
        JSON.stringify({
          success: false,
          error:
            "Invalid --schema mode. Must be 'tables', 'columns', 'full', or 'relationships'. Run --help for usage.",
          executionTimeMs: 0,
        })
      );
      process.exit(1);
    }

    if (schema === "columns" && !table) {
      console.error(
        JSON.stringify({
          success: false,
          error:
            "--schema columns requires --table <name>. Example: --schema columns --table users",
          executionTimeMs: 0,
        })
      );
      process.exit(1);
    }

    return {
      mode: "schema",
      env: env as Environment,
      schema: schema as SchemaMode,
      table,
      format,
    };
  }

  // SQL mode
  if (!sql) {
    console.error(
      JSON.stringify({
        success: false,
        error:
          "Missing --sql or --schema argument. Run --help for usage.",
        executionTimeMs: 0,
      })
    );
    process.exit(1);
  }

  return {
    mode: "sql",
    env: env as Environment,
    sql,
    format,
  };
}

async function waitForPort(
  port: number,
  timeoutMs: number
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const proc = Bun.spawn(
        ["nc", "-z", "localhost", String(port)],
        {
          stdout: "pipe",
          stderr: "pipe",
        }
      );
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        return true;
      }
    } catch {
      // Port not ready yet
    }
    await Bun.sleep(TUNNEL_CHECK_INTERVAL_MS);
  }

  return false;
}

async function getPassword(
  config: DbConfig
): Promise<string | null> {
  if (config.password) {
    return config.password;
  }
  if (config.passwordEnvVar) {
    // First try process.env, then fallback to ~/.zshrc
    const fromEnv = process.env[config.passwordEnvVar];
    if (fromEnv) {
      return fromEnv;
    }

    // Fallback: load from ~/.zshrc
    const zshrcEnv = await loadEnvFromZshrc();
    return zshrcEnv[config.passwordEnvVar] ?? null;
  }
  return null;
}

type SchemaErrorInfo = {
  type: "table_not_found" | "column_not_found" | null;
  missingName: string | null;
  tableName: string | null;
};

function detectSchemaError(
  stderr: string,
  originalSql: string
): SchemaErrorInfo {
  const trimmedError = stderr.trim();

  if (!trimmedError.includes("does not exist")) {
    return {
      type: null,
      missingName: null,
      tableName: null,
    };
  }

  const relationMatch = trimmedError.match(
    /relation "([^"]+)" does not exist/
  );
  if (relationMatch) {
    return {
      type: "table_not_found",
      missingName: relationMatch[1],
      tableName: null,
    };
  }

  const columnMatch = trimmedError.match(
    /column "([^"]+)" does not exist/
  );
  if (columnMatch) {
    const tableFromSql = originalSql.match(
      /FROM\s+["']?(\w+)["']?/i
    );
    return {
      type: "column_not_found",
      missingName: columnMatch[1],
      tableName: tableFromSql?.[1] ?? null,
    };
  }

  return { type: null, missingName: null, tableName: null };
}

async function fetchTableNamesForError(
  config: DbConfig,
  password: string,
  port: number
): Promise<string[]> {
  const psqlProc = Bun.spawn(
    [
      "psql",
      "-h",
      "localhost",
      "-p",
      String(port),
      "-U",
      config.user,
      "-d",
      config.database,
      "-t",
      "-A",
      "-c",
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PGPASSWORD: password },
    }
  );

  const exitCode = await psqlProc.exited;
  if (exitCode !== 0) return [];

  const stdout = await new Response(psqlProc.stdout).text();
  return stdout
    .trim()
    .split("\n")
    .filter((t) => t.length > 0);
}

async function fetchColumnNamesForError(
  config: DbConfig,
  password: string,
  port: number,
  tableName: string
): Promise<string[]> {
  const psqlProc = Bun.spawn(
    [
      "psql",
      "-h",
      "localhost",
      "-p",
      String(port),
      "-U",
      config.user,
      "-d",
      config.database,
      "-t",
      "-A",
      "-c",
      `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}' AND table_schema = 'public' ORDER BY ordinal_position;`,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PGPASSWORD: password },
    }
  );

  const exitCode = await psqlProc.exited;
  if (exitCode !== 0) return [];

  const stdout = await new Response(psqlProc.stdout).text();
  return stdout
    .trim()
    .split("\n")
    .filter((c) => c.length > 0);
}

async function executeSelectQuery(
  config: DbConfig,
  sql: string,
  password: string,
  startTime: number
): Promise<QueryResult> {
  const psqlProc = Bun.spawn(
    [
      "psql",
      "-h",
      "localhost",
      "-p",
      String(config.port),
      "-U",
      config.user,
      "-d",
      config.database,
      "-t", // Tuples only (no headers/footers)
      "-A", // Unaligned output
      "-c",
      `SELECT json_agg(t) FROM (${sql}) t;`,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    }
  );

  const exitCode = await psqlProc.exited;
  const stdout = await new Response(psqlProc.stdout).text();
  const stderr = await new Response(psqlProc.stderr).text();

  if (exitCode !== 0) {
    const schemaError = detectSchemaError(stderr, sql);
    const result: QueryResult = {
      success: false,
      error:
        stderr.trim() ||
        `psql exited with code ${exitCode}`,
      executionTimeMs: Date.now() - startTime,
    };

    if (schemaError.type === "table_not_found") {
      result.availableTables =
        await fetchTableNamesForError(
          config,
          password,
          config.port
        );
      result.hint = `Table "${schemaError.missingName}" not found. Use one of the availableTables listed above.`;
      result.schemaFile = "packages/db/src/schema.ts";
    } else if (
      schemaError.type === "column_not_found" &&
      schemaError.tableName
    ) {
      result.availableColumns =
        await fetchColumnNamesForError(
          config,
          password,
          config.port,
          schemaError.tableName
        );
      result.hint = `Column "${schemaError.missingName}" not found in table "${schemaError.tableName}". Use one of the availableColumns listed above.`;
      result.schemaFile = "packages/db/src/schema.ts";
    }

    return result;
  }

  // Parse JSON result
  const trimmedOutput = stdout.trim();
  if (!trimmedOutput || trimmedOutput === "null") {
    return {
      success: true,
      data: [],
      rowCount: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }

  const data = JSON.parse(trimmedOutput) as Record<
    string,
    unknown
  >[];
  return {
    success: true,
    data,
    rowCount: data.length,
    executionTimeMs: Date.now() - startTime,
  };
}

async function executeMutationQuery(
  config: DbConfig,
  sql: string,
  password: string,
  startTime: number
): Promise<QueryResult> {
  const psqlProc = Bun.spawn(
    [
      "psql",
      "-h",
      "localhost",
      "-p",
      String(config.port),
      "-U",
      config.user,
      "-d",
      config.database,
      "-c",
      sql,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    }
  );

  const exitCode = await psqlProc.exited;
  const stdout = await new Response(psqlProc.stdout).text();
  const stderr = await new Response(psqlProc.stderr).text();

  if (exitCode !== 0) {
    return {
      success: false,
      error:
        stderr.trim() ||
        `psql exited with code ${exitCode}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Parse affected rows from output (e.g., "UPDATE 1", "DELETE 3", "INSERT 0 5")
  const output = stdout.trim();
  const rowCountMatch = output.match(
    /(?:UPDATE|DELETE|INSERT \d+)\s+(\d+)/i
  );
  const rowCount = rowCountMatch
    ? parseInt(rowCountMatch[1], 10)
    : 0;

  return {
    success: true,
    message: output,
    rowCount,
    executionTimeMs: Date.now() - startTime,
  };
}

async function executeQuery(
  config: DbConfig,
  sql: string
): Promise<QueryResult> {
  const startTime = Date.now();
  let tunnelProc: ReturnType<typeof Bun.spawn> | undefined;

  try {
    const password = await getPassword(config);
    if (!password) {
      return {
        success: false,
        error: `Environment variable ${config.passwordEnvVar} is not set.`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const isMutation = isMutationQuery(sql);

    // Check if mutations are allowed for this environment
    if (isMutation && !config.allowMutations) {
      return {
        success: false,
        error: `Mutation queries (UPDATE, INSERT, DELETE, etc.) are not allowed on this environment. Use --env local for mutations.`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Start kubectl port-forward for remote environments
    if (config.needsTunnel) {
      validateKubectlConfig();
      tunnelProc = Bun.spawn(
        [
          "kubectl",
          "port-forward",
          "--context",
          KUBECTL_CONTEXT,
          "--namespace",
          KUBECTL_NAMESPACE,
          "svc/postgresql",
          `${config.port}:${REMOTE_PORT}`,
        ],
        {
          stdout: "pipe",
          stderr: "pipe",
        }
      );

      // Wait for tunnel to be ready
      const tunnelReady = await waitForPort(
        config.port,
        TUNNEL_TIMEOUT_MS
      );
      if (!tunnelReady) {
        return {
          success: false,
          error: "Tunnel failed to open within timeout.",
          executionTimeMs: Date.now() - startTime,
        };
      }
    }

    // Execute appropriate query type
    if (isMutation) {
      return await executeMutationQuery(
        config,
        sql,
        password,
        startTime
      );
    } else {
      return await executeSelectQuery(
        config,
        sql,
        password,
        startTime
      );
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    // Cleanup tunnel
    if (tunnelProc) {
      tunnelProc.kill();
    }
  }
}

/**
 * Execute schema introspection query.
 */
async function executeSchemaQuery(
  config: DbConfig,
  schemaMode: SchemaMode,
  tableName?: string
): Promise<QueryResult> {
  const startTime = Date.now();

  let sql: string;
  switch (schemaMode) {
    case "tables":
      sql = SCHEMA_QUERIES.tables;
      break;
    case "columns":
      if (!tableName) {
        return {
          success: false,
          error: "--schema columns requires --table <name>",
          executionTimeMs: Date.now() - startTime,
        };
      }
      sql = SCHEMA_QUERIES.columns(tableName);
      break;
    case "relationships":
      sql = SCHEMA_QUERIES.relationships;
      break;
    case "full":
      // Full schema requires multiple queries - get tables first, then columns for each
      return await executeFullSchemaQuery(
        config,
        startTime
      );
  }

  // Execute the introspection query
  const result = await executeQuery(config, sql);

  // For schema queries, add schema mode info to output
  if (result.success) {
    return {
      ...result,
      message: `Schema introspection: ${schemaMode}${tableName ? ` for table '${tableName}'` : ""}`,
    };
  }

  return result;
}

/**
 * Execute full schema query (all tables with their columns).
 */
async function executeFullSchemaQuery(
  config: DbConfig,
  startTime: number
): Promise<QueryResult> {
  // First get all tables
  const tablesResult = await executeQuery(
    config,
    SCHEMA_QUERIES.tables
  );

  if (!tablesResult.success || !tablesResult.data) {
    return tablesResult;
  }

  const tables = tablesResult.data as { name: string }[];
  const fullSchema: Record<string, unknown>[] = [];

  // Get columns for each table
  for (const table of tables) {
    const columnsResult = await executeQuery(
      config,
      SCHEMA_QUERIES.columns(table.name)
    );

    if (columnsResult.success && columnsResult.data) {
      fullSchema.push({
        table: table.name,
        columns: columnsResult.data,
      });
    }
  }

  return {
    success: true,
    data: fullSchema,
    rowCount: fullSchema.length,
    message: `Full schema: ${fullSchema.length} tables`,
    executionTimeMs: Date.now() - startTime,
  };
}

function formatOutput(
  result: QueryResult,
  format: OutputFormat
): string {
  if (format === "toon") {
    return encodeToon(result);
  }
  return JSON.stringify(result, null, 2);
}

async function main(): Promise<void> {
  const args = parseArgs();

  // Handle --help
  if (args.mode === "help") {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const config = DB_CONFIGS[args.env];

  // Handle --schema
  if (args.mode === "schema") {
    const result = await executeSchemaQuery(
      config,
      args.schema,
      args.table
    );
    console.log(formatOutput(result, args.format));
    return;
  }

  // Handle --sql
  const result = await executeQuery(config, args.sql);
  console.log(formatOutput(result, args.format));
}

void main();
