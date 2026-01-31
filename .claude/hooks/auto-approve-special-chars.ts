#!/usr/bin/env bun
import { join, resolve, dirname } from "node:path";
import { existsSync, statSync } from "node:fs";

// Characters that break the permission matcher
const SPECIAL_CHARS = ["$", "[", "]", ":", "..."] as const;

// Your project's route directories (workspace-relative)
const ALLOWED_DIRS = ["apps/web-app/src/routes"];

interface ToolInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
  permission_mode:
    | "default"
    | "bypassPermissions"
    | "plan"
    | "acceptEdits";
  cwd: string;
}

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: "PreToolUse";
    permissionDecision: "allow";
    permissionDecisionReason: string;
  };
}

function hasSpecialChars(path: string): boolean {
  return SPECIAL_CHARS.some((char) => path.includes(char));
}

function isWithinWorkspace(
  filePath: string,
  workspaceRoot: string
): boolean {
  try {
    const absFile = resolve(filePath);
    const absWorkspace = resolve(workspaceRoot);
    const normalizedWorkspace = absWorkspace.endsWith("/")
      ? absWorkspace
      : `${absWorkspace}/`;
    return absFile.startsWith(normalizedWorkspace);
  } catch {
    return false;
  }
}

function isInAllowedDirectory(
  filePath: string,
  workspaceRoot: string
): boolean {
  const absFile = resolve(filePath);
  for (const relDir of ALLOWED_DIRS) {
    const allowedAbs = join(workspaceRoot, relDir);
    const normalizedAllowed = allowedAbs.endsWith("/")
      ? allowedAbs
      : `${allowedAbs}/`;
    if (absFile.startsWith(normalizedAllowed)) {
      return true;
    }
  }
  return false;
}

async function main() {
  try {
    // Read JSON from stdin using Bun's native API
    const stdinText = await Bun.stdin.text();
    const inputData: ToolInput = JSON.parse(stdinText);

    const toolName = inputData.tool_name ?? "";
    const filePath = inputData.tool_input?.file_path ?? "";
    const permissionMode =
      inputData.permission_mode ?? "default";
    const workspaceRoot = inputData.cwd ?? import.meta.dir;

    // Only process file operations with special chars
    if (
      !["Read", "Edit", "Write", "Update"].includes(
        toolName
      )
    ) {
      process.exit(0);
    }
    if (!hasSpecialChars(filePath)) {
      process.exit(0);
    }

    // Security checks
    if (!isWithinWorkspace(filePath, workspaceRoot)) {
      process.exit(0);
    }

    if (
      ["Read", "Edit", "Update"].includes(toolName) &&
      !existsSync(filePath)
    ) {
      process.exit(0);
    } else if (toolName === "Write") {
      const parentDir = dirname(filePath);
      if (
        !existsSync(parentDir) ||
        !statSync(parentDir).isDirectory()
      ) {
        process.exit(0);
      }
    }

    // Respect permission modes
    if (
      ["bypassPermissions", "plan"].includes(permissionMode)
    ) {
      process.exit(0);
    }
    if (
      permissionMode === "default" &&
      toolName !== "Read"
    ) {
      process.exit(0);
    }

    // Check allowed directory
    if (!isInAllowedDirectory(filePath, workspaceRoot)) {
      process.exit(0);
    }

    // Auto-approve
    const response: HookOutput = {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: `Auto-approved ${toolName}: ${filePath.split("/").pop()}`,
      },
    };

    console.log(JSON.stringify(response));
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

void main();
