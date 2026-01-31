/**
 * Application Logs Tool for Coding Agents
 *
 * Reads application logs from local development or test/prod environments.
 * For test/prod, uses k8s-tool internally to access logs from PVC.
 *
 * Run with --help for full usage documentation.
 *
 * IMPORTANT FOR AI AGENTS:
 * Use this tool to investigate application behavior and errors.
 * Always start with --list to see available log files.
 * Use --format toon for LLM-optimized output (fewer tokens).
 */

import { encode as encodeToon } from "@toon-format/toon";
import { runKubectl, K8S_CONFIG } from "./k8s-tool";

type Environment = "local" | "test" | "prod";
type OutputFormat = "json" | "toon";

type ParsedArgs =
  | { mode: "help" }
  | { mode: "list"; env: Environment; format: OutputFormat }
  | {
      mode: "read";
      env: Environment;
      tail?: number;
      grep?: string;
      file?: string;
      pretty: boolean;
      format: OutputFormat;
    };

type LogResult = {
  success: boolean;
  data?: string | string[] | Record<string, unknown>[];
  error?: string;
  source?: string;
  executionTimeMs: number;
};

/**
 * Local logs configuration.
 * Update this path to match your application's log directory.
 */
const LOCAL_LOGS_DIR = "logs";

/**
 * Remote logs configuration (test/prod).
 * Update this path to match where logs are stored in your pods.
 */
const REMOTE_LOGS_PATH = "/app/logs";

/**
 * Pod selector label for finding the web app pod.
 * Update this to match your Kubernetes deployment labels.
 */
const POD_SELECTOR_LABEL =
  "app.kubernetes.io/name=blogic-web-app";

/**
 * Help text for --help flag.
 */
const HELP_TEXT = `
Application Logs Tool for Coding Agents

USAGE:
  bun run tools/logs-tool.ts --help
  bun run tools/logs-tool.ts --env <local|test|prod> --list
  bun run tools/logs-tool.ts --env <local|test|prod> [options]

OPTIONS:
  --help                 Show this help message
  --env <environment>    Target environment: local, test, or prod
  --list                 List available log files
  --tail <n>             Show last N lines (default: 100)
  --grep "<pattern>"     Filter lines containing pattern
  --file <name>          Read specific log file (default: latest)
  --pretty               Pretty-print JSON log entries
  --format <json|toon>   Output format (default: toon). Use 'json' for standard JSON output

LOG LOCATIONS:
  Local:      ${LOCAL_LOGS_DIR}/app.YYYY-MM-DD.N.log
  Test/Prod:  ${REMOTE_LOGS_PATH}/app.log (PVC mounted)

SETUP:
  Before using for test/prod, configure:
  1. K8S_CONFIG in tools/k8s-tool.ts
  2. POD_SELECTOR_LABEL in this file to match your deployment

WORKFLOW FOR AI AGENTS:
  1. First list available log files:
     bun run tools/logs-tool.ts --env local --list

  2. Read recent logs:
     bun run tools/logs-tool.ts --env local --tail 100

  3. Search for specific patterns:
     bun run tools/logs-tool.ts --env test --grep "error" --tail 200

  4. Pretty-print JSON logs:
     bun run tools/logs-tool.ts --env local --tail 50 --pretty

EXAMPLES:
  # List log files
  bun run tools/logs-tool.ts --env local --list
  bun run tools/logs-tool.ts --env test --list

  # Read last 100 lines
  bun run tools/logs-tool.ts --env local --tail 100
  bun run tools/logs-tool.ts --env test --tail 100

  # Search for errors
  bun run tools/logs-tool.ts --env local --grep "error" --tail 200
  bun run tools/logs-tool.ts --env test --grep "trpc" --tail 100

  # Read specific file
  bun run tools/logs-tool.ts --env local --file app.2026-01-21.1.log --tail 50

  # Pretty-print JSON logs
  bun run tools/logs-tool.ts --env local --tail 20 --pretty

OUTPUT:
  TOON: Token-efficient format for LLM agents - DEFAULT
  JSON: { success, data?, error?, source?, executionTimeMs }

RELATED TOOLS:
  - k8s-tool.ts: Raw kubectl commands (used internally)
  - db-tool.ts: Database queries and schema introspection
`.trim();

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
  let list = false;
  let tail: number | undefined;
  let grep: string | undefined;
  let file: string | undefined;
  let pretty = false;
  let format: OutputFormat = "toon";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--env" && args[i + 1]) {
      env = args[i + 1];
      i++;
    } else if (args[i] === "--list") {
      list = true;
    } else if (args[i] === "--tail" && args[i + 1]) {
      tail = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--grep" && args[i + 1]) {
      grep = args[i + 1];
      i++;
    } else if (args[i] === "--file" && args[i + 1]) {
      file = args[i + 1];
      i++;
    } else if (args[i] === "--pretty") {
      pretty = true;
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

  if (list) {
    return {
      mode: "list",
      env: env as Environment,
      format,
    };
  }

  return {
    mode: "read",
    env: env as Environment,
    tail: tail ?? 100,
    grep,
    file,
    pretty,
    format,
  };
}

/**
 * List local log files.
 */
async function listLocalLogs(): Promise<LogResult> {
  const startTime = Date.now();

  try {
    const proc = Bun.spawn(["ls", "-la", LOCAL_LOGS_DIR], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      return {
        success: false,
        error: stderr.trim() || "Failed to list local logs",
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Parse ls output to get file names
    const lines = stdout.trim().split("\n").slice(1); // Skip "total" line
    const files = lines
      .filter((line) => line.includes(".log"))
      .map((line) => {
        const parts = line.split(/\s+/);
        return {
          name: parts[parts.length - 1],
          size: parts[4],
          date: `${parts[5]} ${parts[6]} ${parts[7]}`,
        };
      });

    return {
      success: true,
      data: files,
      source: LOCAL_LOGS_DIR,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * List remote log files (test/prod).
 */
async function listRemoteLogs(
  env: "test" | "prod"
): Promise<LogResult> {
  const startTime = Date.now();
  const namespace = K8S_CONFIG.namespaces[env];

  // First get the pod name
  const podResult = await runKubectl(
    `get pods -n ${namespace} -l ${POD_SELECTOR_LABEL} -o jsonpath='{.items[0].metadata.name}'`
  );

  if (!podResult.success || !podResult.output) {
    return {
      success: false,
      error: podResult.error ?? "Failed to get pod name",
      executionTimeMs: Date.now() - startTime,
    };
  }

  const podName = podResult.output.replace(/'/g, "");

  // List log files in the pod
  const lsResult = await runKubectl(
    `exec ${podName} -n ${namespace} -- ls -la ${REMOTE_LOGS_PATH}`
  );

  if (!lsResult.success) {
    return {
      success: false,
      error: lsResult.error ?? "Failed to list remote logs",
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Parse ls output
  const lines = (lsResult.output ?? "")
    .trim()
    .split("\n")
    .slice(1);
  const files = lines
    .filter((line) => line.includes(".log"))
    .map((line) => {
      const parts = line.split(/\s+/);
      return {
        name: parts[parts.length - 1],
        size: parts[4],
        date: `${parts[5]} ${parts[6]} ${parts[7]}`,
      };
    });

  return {
    success: true,
    data: files,
    source: `${podName}:${REMOTE_LOGS_PATH}`,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Read local log files.
 */
async function readLocalLogs(
  tail: number,
  grep?: string,
  file?: string,
  pretty?: boolean
): Promise<LogResult> {
  const startTime = Date.now();

  try {
    // If no specific file, find the latest log file
    let logFile = file;
    if (!logFile) {
      const lsProc = Bun.spawn(
        [
          "sh",
          "-c",
          `ls -t ${LOCAL_LOGS_DIR}/*.log 2>/dev/null | head -1`,
        ],
        { stdout: "pipe", stderr: "pipe" }
      );
      await lsProc.exited;
      logFile = (
        await new Response(lsProc.stdout).text()
      ).trim();

      if (!logFile) {
        return {
          success: false,
          error: "No log files found",
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Extract just the filename
      logFile = logFile.split("/").pop() ?? logFile;
    }

    const fullPath = `${LOCAL_LOGS_DIR}/${logFile}`;

    // Build command
    let cmd = `tail -${tail} "${fullPath}"`;
    if (grep) {
      cmd += ` | grep -i "${grep}"`;
    }

    const proc = Bun.spawn(["sh", "-c", cmd], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    // grep returns exit code 1 if no matches, which is fine
    if (exitCode !== 0 && exitCode !== 1) {
      return {
        success: false,
        error:
          stderr.trim() ||
          `Command failed with exit code ${exitCode}`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const output = stdout.trim();

    // Pretty print JSON if requested
    if (pretty && output) {
      const lines = output.split("\n");
      const prettified = lines
        .map((line) => {
          try {
            const json = JSON.parse(line);
            return JSON.stringify(json, null, 2);
          } catch {
            return line;
          }
        })
        .join("\n---\n");

      return {
        success: true,
        data: prettified,
        source: fullPath,
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: output || "(no matching lines)",
      source: fullPath,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Read remote log files (test/prod).
 */
async function readRemoteLogs(
  env: "test" | "prod",
  tail: number,
  grep?: string,
  file?: string,
  pretty?: boolean
): Promise<LogResult> {
  const startTime = Date.now();
  const namespace = K8S_CONFIG.namespaces[env];

  // First get the pod name
  const podResult = await runKubectl(
    `get pods -n ${namespace} -l ${POD_SELECTOR_LABEL} -o jsonpath='{.items[0].metadata.name}'`
  );

  if (!podResult.success || !podResult.output) {
    return {
      success: false,
      error: podResult.error ?? "Failed to get pod name",
      executionTimeMs: Date.now() - startTime,
    };
  }

  const podName = podResult.output.replace(/'/g, "");

  // Determine which log file to read
  let logFile = file ?? "app.log";
  const logPath = `${REMOTE_LOGS_PATH}/${logFile}`;

  // Build command to execute in pod
  let cmd = `tail -${tail} ${logPath}`;
  if (grep) {
    cmd += ` | grep -i '${grep}'`;
  }

  const result = await runKubectl(
    `exec ${podName} -n ${namespace} -- sh -c "${cmd}"`
  );

  if (!result.success) {
    // Check if it's just grep with no matches (exit code 1)
    if (result.error?.includes("exit code 1") && grep) {
      return {
        success: true,
        data: "(no matching lines)",
        source: `${podName}:${logPath}`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: false,
      error: result.error ?? "Failed to read remote logs",
      executionTimeMs: Date.now() - startTime,
    };
  }

  const output = result.output ?? "";

  // Pretty print JSON if requested
  if (pretty && output) {
    const lines = output.split("\n");
    const prettified = lines
      .map((line) => {
        try {
          const json = JSON.parse(line);
          return JSON.stringify(json, null, 2);
        } catch {
          return line;
        }
      })
      .join("\n---\n");

    return {
      success: true,
      data: prettified,
      source: `${podName}:${logPath}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  return {
    success: true,
    data: output || "(no matching lines)",
    source: `${podName}:${logPath}`,
    executionTimeMs: Date.now() - startTime,
  };
}

function formatOutput(
  result: LogResult,
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

  let result: LogResult;

  if (args.mode === "list") {
    if (args.env === "local") {
      result = await listLocalLogs();
    } else {
      result = await listRemoteLogs(args.env);
    }
  } else {
    // read mode
    if (args.env === "local") {
      result = await readLocalLogs(
        args.tail!,
        args.grep,
        args.file,
        args.pretty
      );
    } else {
      result = await readRemoteLogs(
        args.env,
        args.tail!,
        args.grep,
        args.file,
        args.pretty
      );
    }
  }

  console.log(formatOutput(result, args.format));
}

void main();
