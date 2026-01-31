/**
 * OpenCode plugin: run repo checks after edits.
 *
 * Mirrors the intent of:
 * - .claude/check-after-edit.sh
 * - .claude/check-after-stop.sh
 *
 * Behavior:
 * - Mark the session as "dirty" on file edit/write tool calls.
 * - Run `bun run check` once the session reports `session.status: idle`.
 *
 * This avoids false negatives from intermediate edit states
 * (eg. added import but not yet used).
 */

import type {
  Plugin,
  PluginInput,
} from "@opencode-ai/plugin";

type Shell = PluginInput["$"];

type CommandResult = {
  exitCode: number;
  stdout?: unknown;
  stderr?: unknown;
};

function truncateTail(text: string, maxLines: number) {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  return lines.slice(-maxLines).join("\n");
}

function decodeShellOutput(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }
  return "";
}

async function runCommand(
  $: Shell,
  command: string,
  cwd: string
): Promise<{ exitCode: number; output: string }> {
  const bashCmd = `cd ${JSON.stringify(cwd)} && CI=1 ${command}`;

  const result =
    (await $.nothrow()`bash -lc ${bashCmd}`.quiet()) as unknown as CommandResult;

  const stdout = decodeShellOutput(result.stdout);
  const stderr = decodeShellOutput(result.stderr);

  return {
    exitCode: result.exitCode,
    output:
      `${stdout}${stderr ? `\n${stderr}` : ""}`.trim(),
  };
}

function formatFailureMessage({
  cmd,
  output,
  failureMsg,
}: {
  cmd: string;
  output: string;
  failureMsg: string;
}) {
  const maxLines = 40;
  const tail = truncateTail(output, maxLines);
  const truncatedNote =
    output.split("\n").length > maxLines
      ? `\n\n[Output truncated - showing last ${maxLines} lines]\n`
      : "\n";

  return [
    failureMsg,
    "",
    `Command: ${cmd}`,
    truncatedNote,
    tail,
    "",
    `To see full output, run: ${cmd}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function getFilePathFromToolOutput(
  toolOutput: unknown
): string | undefined {
  if (
    typeof toolOutput !== "object" ||
    toolOutput === null
  ) {
    return undefined;
  }

  const output = toolOutput as {
    args?: { filePath?: unknown };
    metadata?: { args?: { filePath?: unknown } };
  };

  const filePath =
    output.metadata?.args?.filePath ??
    output.args?.filePath;
  return typeof filePath === "string"
    ? filePath
    : undefined;
}

export const CheckRunner: Plugin = async ({
  directory,
  worktree,
  $,
}) => {
  let didEdit = false;
  let dirty = false;
  let checkInFlight = false;
  let checkQueued = false;

  const projectRoot = worktree ?? directory;

  const runCheck = async ({
    hookType,
  }: {
    hookType: "after-turn" | "stop";
  }) => {
    const cmd = "bun run check";

    const { exitCode, output } = await runCommand(
      $,
      cmd,
      projectRoot
    );
    if (exitCode === 0) return;

    const failureMsg =
      hookType === "after-turn"
        ? "Checks failed after edit batch"
        : "Checks failed on session stop";

    throw new Error(
      formatFailureMessage({ cmd, output, failureMsg })
    );
  };

  const scheduleIdleCheck = async () => {
    // Avoid running multiple checks in parallel if many sessions become idle.
    if (checkInFlight) {
      checkQueued = true;
      return;
    }

    checkInFlight = true;
    try {
      await runCheck({ hookType: "after-turn" });
      dirty = false;
    } finally {
      checkInFlight = false;
      if (checkQueued) {
        checkQueued = false;
        if (dirty) {
          await scheduleIdleCheck();
        }
      }
    }
  };

  return {
    "tool.execute.after": async (input, output) => {
      const tool = (input as { tool?: unknown } | undefined)
        ?.tool;
      if (tool !== "edit" && tool !== "write") return;

      const filePath = getFilePathFromToolOutput(output);
      if (filePath && !filePath.startsWith(projectRoot))
        return;

      didEdit = true;
      dirty = true;
    },

    event: async ({ event }) => {
      if (!didEdit) return;

      if (
        (event as { type?: unknown } | undefined)?.type ===
          "session.status" &&
        (
          event as
            | {
                properties?: {
                  status?: { type?: unknown };
                };
              }
            | undefined
        )?.properties?.status?.type === "idle" &&
        dirty
      ) {
        await scheduleIdleCheck();
        return;
      }

      // Fallback: when OpenCode considers the session finished/idle.
      if (
        (event as { type?: unknown } | undefined)?.type ===
          "session.idle" &&
        dirty &&
        !checkInFlight
      ) {
        await runCheck({ hookType: "stop" });
        dirty = false;
      }
    },
  };
};
