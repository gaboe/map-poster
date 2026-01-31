import type {
  Plugin,
  PluginInput,
} from "@opencode-ai/plugin";

/**
 * OpenCode plugin: bell/confetti notifications.
 *
 * Mirrors the behavior from `blogic-marketplace/agent-kit/scripts/*`:
 * - session completion: Glass sound + Raycast confetti (fallback: notification)
 * - approval needed / errors: Basso sound + notification
 */

type Shell = PluginInput["$"];

const isMacOS = process.platform === "darwin";

async function playSound($: Shell, soundName: string) {
  if (!isMacOS) return;

  // Don't block the plugin on sound playback.
  const cmd = `afplay /System/Library/Sounds/${soundName}.aiff 2>/dev/null &`;
  await $.nothrow()`bash -lc ${cmd}`.quiet();
}

async function macNotification(
  $: Shell,
  {
    title,
    message,
    soundName,
  }: { title: string; message: string; soundName?: string }
) {
  if (!isMacOS) return;

  const scriptParts = [
    `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`,
    soundName
      ? `sound name ${JSON.stringify(soundName)}`
      : "",
  ].filter(Boolean);

  await $`osascript -e ${scriptParts.join(" ")}`;
}

async function celebrate($: Shell) {
  if (!isMacOS) return;

  await playSound($, "Glass");

  // const result =
  //   await $.nothrow()`open 'raycast://extensions/raycast/raycast/confetti'`.quiet();
  // if (result.exitCode === 0) return;

  await macNotification($, {
    title: "🎉 opencode",
    message: "Session completed!",
    soundName: "Glass",
  });
}

export const NotificationPlugin: Plugin = async ({
  directory,
  worktree,
  $,
}) => {
  const root = worktree ?? directory;
  const label = root.split("/").filter(Boolean).pop();
  const title = label ? `opencode (${label})` : "opencode";

  return {
    event: async ({ event }) => {
      if (!event?.type) return;

      if (event.type === "session.idle") {
        await celebrate($);
        return;
      }

      if (event.type === "permission.updated") {
        const approvalMessage =
          event.properties.title || "Approval required";
        await playSound($, "Basso");
        await macNotification($, {
          title: "⚠️ opencode needs approval",
          message: approvalMessage,
          soundName: "Basso",
        });
        return;
      }

      if (event.type === "session.error") {
        await playSound($, "Basso");
        await macNotification($, {
          title,
          message: "Session error",
          soundName: "Basso",
        });
      }
    },
  };
};
