/**
 * Kubernetes CLI Tool for Coding Agents
 *
 * Executes kubectl commands against the correct cluster context.
 * Supports shell pipes and complex commands.
 *
 * Run with --help for full usage documentation.
 *
 * IMPORTANT FOR AI AGENTS:
 * Always use this tool instead of kubectl directly to ensure
 * commands run against the correct cluster context.
 * Use --format toon for LLM-optimized output (fewer tokens).
 */

import { encode as encodeToon } from "@toon-format/toon";

type Environment = "test" | "prod";
type OutputFormat = "json" | "toon";

type ParsedArgs =
  | { mode: "help" }
  | {
      mode: "cmd";
      env: Environment;
      cmd: string;
      dryRun: boolean;
      format: OutputFormat;
    };

type CommandResult = {
  success: boolean;
  output?: string;
  error?: string;
  command?: string;
  executionTimeMs: number;
};

/**
 * Kubernetes cluster configuration.
 * Cluster ID is stable across machines; context name is resolved dynamically.
 *
 * Update these values for your specific Kubernetes setup:
 * - clusterId: Find with `kubectl config view -o json | jq '.clusters[].name'`
 * - namespaces: Your application's test/prod/system namespaces
 */
const K8S_CONFIG = {
  // Stable cluster ID - context name may differ per machine
  // Replace with your actual cluster ID
  clusterId: "your-cluster-id",
  namespaces: {
    test: "blogic-test",
    prod: "blogic-prod",
    system: "bl-system",
  },
} as const;

// Cache for resolved context name
let resolvedContext: string | null = null;

/**
 * Validate K8S_CONFIG is properly configured.
 */
function validateK8sConfig(): void {
  if (K8S_CONFIG.clusterId === "your-cluster-id") {
    throw new Error(
      "K8S_CONFIG.clusterId must be configured in tools/k8s-tool.ts before using test/prod environments. " +
        "Find your cluster ID with: kubectl config view -o json | jq '.clusters[].name'"
    );
  }
}

/**
 * Resolve kubectl context name from cluster ID.
 * Context names can differ per machine, but cluster ID is stable.
 */
async function resolveContext(): Promise<string> {
  if (resolvedContext) {
    return resolvedContext;
  }

  validateK8sConfig();

  try {
    const proc = Bun.spawn(
      [
        "sh",
        "-c",
        `kubectl config view -o json | jq -r '.contexts[] | select(.context.cluster == "${K8S_CONFIG.clusterId}") | .name' | head -1`,
      ],
      { stdout: "pipe", stderr: "pipe" }
    );

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    if (exitCode === 0 && stdout.trim()) {
      resolvedContext = stdout.trim();
      return resolvedContext;
    }

    // Fallback: try to find by server URL containing the cluster ID
    const fallbackProc = Bun.spawn(
      [
        "sh",
        "-c",
        `kubectl config view -o json | jq -r '.contexts[] as $ctx | .clusters[] | select(.name == $ctx.context.cluster and (.cluster.server | contains("${K8S_CONFIG.clusterId}"))) | $ctx.name' | head -1`,
      ],
      { stdout: "pipe", stderr: "pipe" }
    );

    const fallbackExitCode = await fallbackProc.exited;
    const fallbackStdout = await new Response(
      fallbackProc.stdout
    ).text();

    if (fallbackExitCode === 0 && fallbackStdout.trim()) {
      resolvedContext = fallbackStdout.trim();
      return resolvedContext;
    }

    throw new Error(
      `No kubectl context found for cluster ID: ${K8S_CONFIG.clusterId}. ` +
        `Make sure you have the cluster configured in kubectl.`
    );
  } catch (error) {
    throw new Error(
      `Failed to resolve kubectl context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Help text for --help flag.
 */
const HELP_TEXT = `
Kubernetes CLI Tool for Coding Agents

USAGE:
  bun run tools/k8s-tool.ts --help
  bun run tools/k8s-tool.ts --env <test|prod> --cmd "<kubectl command>"
  bun run tools/k8s-tool.ts --env <test|prod> --cmd "<command>" --dry-run

OPTIONS:
  --help                 Show this help message
  --env <environment>    Target environment: test or prod
  --cmd "<command>"      kubectl command (without 'kubectl' prefix)
  --dry-run              Show command without executing
  --format <json|toon>   Output format (default: toon). Use 'json' for standard JSON output

CLUSTER CONFIGURATION:
  Cluster ID: ${K8S_CONFIG.clusterId}
  Test namespace: ${K8S_CONFIG.namespaces.test}
  Prod namespace: ${K8S_CONFIG.namespaces.prod}
  System namespace: ${K8S_CONFIG.namespaces.system}
  (Context name is resolved dynamically from cluster ID)

SETUP:
  Before using, configure K8S_CONFIG in tools/k8s-tool.ts:
  1. Set clusterId to your Kubernetes cluster ID
  2. Update namespaces to match your environment

WORKFLOW FOR AI AGENTS:
  1. Use this tool for ALL kubectl operations on test/prod
  2. Pipes are supported - use shell syntax
  3. Use -n ${K8S_CONFIG.namespaces.test} for test, -n ${K8S_CONFIG.namespaces.prod} for prod

EXAMPLES:
  # List pods in test namespace
  bun run tools/k8s-tool.ts --env test --cmd "get pods -n ${K8S_CONFIG.namespaces.test}"

  # Get pod logs with grep
  bun run tools/k8s-tool.ts --env test --cmd "logs -l app=web-app -n ${K8S_CONFIG.namespaces.test} --tail=100 | grep error"

  # Check resource usage
  bun run tools/k8s-tool.ts --env test --cmd "top pod -n ${K8S_CONFIG.namespaces.test}"

  # Describe pod with filtered output
  bun run tools/k8s-tool.ts --env test --cmd "describe pod web-app-xxx -n ${K8S_CONFIG.namespaces.test} | grep -A20 Events"

  # Execute command in pod
  bun run tools/k8s-tool.ts --env test --cmd "exec web-app-xxx -n ${K8S_CONFIG.namespaces.test} -- cat /app/logs/app.log | tail -50"

  # Dry run - show command without executing
  bun run tools/k8s-tool.ts --env test --cmd "get pods -n ${K8S_CONFIG.namespaces.test}" --dry-run

NAMESPACES:
  -n ${K8S_CONFIG.namespaces.test}  Test environment pods
  -n ${K8S_CONFIG.namespaces.prod}  Production environment pods
  -n ${K8S_CONFIG.namespaces.system}    System services (postgresql, etc.)

OUTPUT:
  TOON: Token-efficient format for LLM agents - DEFAULT
  JSON: { success, output?, error?, command?, executionTimeMs }

RELATED TOOLS:
  - logs-tool.ts: Higher-level tool for reading application logs
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
  let cmd: string | undefined;
  let dryRun = false;
  let format: OutputFormat = "toon";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--env" && args[i + 1]) {
      env = args[i + 1];
      i++;
    } else if (args[i] === "--cmd" && args[i + 1]) {
      cmd = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--format" && args[i + 1]) {
      const f = args[i + 1];
      if (f === "json" || f === "toon") {
        format = f;
      }
      i++;
    }
  }

  // Validate environment
  if (!env || !["test", "prod"].includes(env)) {
    console.error(
      JSON.stringify({
        success: false,
        error:
          "Invalid or missing --env. Must be 'test' or 'prod'. Run --help for usage.",
        executionTimeMs: 0,
      })
    );
    process.exit(1);
  }

  // Validate command
  if (!cmd) {
    console.error(
      JSON.stringify({
        success: false,
        error:
          "Missing --cmd argument. Run --help for usage.",
        executionTimeMs: 0,
      })
    );
    process.exit(1);
  }

  return {
    mode: "cmd",
    env: env as Environment,
    cmd,
    dryRun,
    format,
  };
}

/**
 * Execute kubectl command with shell support for pipes.
 */
async function executeKubectlCommand(
  cmd: string,
  dryRun: boolean
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    // Resolve context from cluster ID
    const context = await resolveContext();

    // Build full command with context
    const fullCommand = `kubectl --context ${context} ${cmd}`;

    if (dryRun) {
      return {
        success: true,
        command: fullCommand,
        output: "(dry run - command not executed)",
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Use shell to support pipes
    const proc = Bun.spawn(["sh", "-c", fullCommand], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      return {
        success: false,
        error:
          stderr.trim() ||
          `kubectl exited with code ${exitCode}`,
        command: fullCommand,
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      output: stdout.trim(),
      command: fullCommand,
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
 * Export for use by other tools (e.g., logs-tool.ts).
 */
export async function runKubectl(
  cmd: string,
  options?: { dryRun?: boolean }
): Promise<CommandResult> {
  return executeKubectlCommand(
    cmd,
    options?.dryRun ?? false
  );
}

export { K8S_CONFIG };

function formatOutput(
  result: CommandResult,
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

  // Execute command
  const result = await executeKubectlCommand(
    args.cmd,
    args.dryRun
  );
  console.log(formatOutput(result, args.format));
}

// Only run main when executed directly (not when imported)
if (import.meta.main) {
  void main();
}
