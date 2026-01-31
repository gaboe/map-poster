import {
  Link,
  useLocation,
  getRouteApi,
} from "@tanstack/react-router";

type Props = {
  className?: string;
};

const BANNER_ID = "pr-launch";

function setCookie(
  name: string,
  value: string,
  days: number = 365
) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(
    expires.getTime() + days * 24 * 60 * 60 * 1000
  );
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

const webRoute = getRouteApi("/_web");

export function PRPromotionBanner({
  className = "",
}: Props) {
  const location = useLocation();

  // Try to get web route data, fallback to false if not in web layout
  let bannerVisible = false;
  try {
    const webData = webRoute.useLoaderData();
    bannerVisible = webData?.bannerData?.prBanner ?? false;
  } catch {
    // Not in web layout, don't show banner
    bannerVisible = false;
  }

  // Don't show banner on the article page it's promoting
  const isOnArticlePage =
    location.pathname ===
    "/newsroom/introducing-map-poster-production-ready-fullstack-typescript";

  if (!bannerVisible || isOnArticlePage) {
    return null;
  }

  const handleDismiss = () => {
    setCookie(`banner-dismissed-${BANNER_ID}`, "true", 365);
    window.location.reload();
  };

  return (
    <div
      className={`bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600 text-white relative z-50 shadow-md ${className}`}
    >
      <div className="container mx-auto px-4 py-1 max-w-4xl">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center h-full">
              <div
                className={`w-2 h-2 bg-green-400 rounded-full animate-pulse ${
                  location.pathname === "/" ? "mt-1.5" : ""
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <span className="hidden sm:inline">
                  🎉{" "}
                </span>
                Introducing map-poster - Production-Ready
                Full-Stack TypeScript Template
                <span className="hidden md:inline">
                  {" "}
                  for Modern Web Development
                </span>
              </p>
            </div>
            <Link
              to="/newsroom/$articleId"
              params={{
                articleId:
                  "introducing-map-poster-production-ready-fullstack-typescript",
              }}
              className="flex items-center gap-2 text-sm font-medium hover:underline flex-shrink-0 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
            >
              Read More
            </Link>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-3 rounded-full transition-all duration-200 hover:scale-110 cursor-pointer relative z-10 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Dismiss announcement"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
