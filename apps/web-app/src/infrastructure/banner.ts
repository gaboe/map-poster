import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

type BannerConfig = {
  id: string;
  launchDate: string;
  durationDays: number;
};

function checkBannerVisibility(
  config: BannerConfig
): boolean {
  const launchDate = new Date(config.launchDate);
  const currentDate = new Date();
  const durationInMs =
    config.durationDays * 24 * 60 * 60 * 1000;
  const isWithinDuration =
    currentDate.getTime() - launchDate.getTime() <=
    durationInMs;

  // Check if dismissed via cookie using banner ID
  const isDismissed =
    getCookie(`banner-dismissed-${config.id}`) === "true";

  return isWithinDuration && !isDismissed;
}

export const getBannerVisibilityServerFn =
  createServerFn().handler(async () => {
    const prBannerConfig: BannerConfig = {
      id: "pr-map-poster-launch",
      launchDate: "2025-09-03",
      durationDays: 14,
    };

    return {
      prBanner: checkBannerVisibility(prBannerConfig),
    };
  });
