import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  Object.assign(
    process.env,
    loadEnv(mode, process.cwd(), "")
  );

  return {
    server: {
      port: 3000,
      ...(mode === "development"
        ? { allowedHosts: true }
        : {}),
    },
    build: {
      target: "esnext",
      sourcemap: true,
      rollupOptions: {
        external: ["satori", "@resvg/resvg-js"],
      },
    },
    optimizeDeps: {
      // Exclude server-only dependencies from pre-bundling
      exclude: ["@resvg/resvg-js", "satori"],
    },
    ssr: {
      // Streamdown imports KaTeX CSS which fails when externalized during SSR.
      // date-fns needs to be bundled to avoid default export issues during prerender
      noExternal: ["date-fns"],
      // Externalize native Node.js modules used only in server routes
      external: ["@resvg/resvg-js", "satori"],
    },
    plugins: [
      tsConfigPaths({
        ignoreConfigErrors: true,
      }),
      tailwindcss(),
      tanstackStart({
        sitemap: {
          host: process.env.VITE_BASE_URL,
        },
        prerender: {
          enabled: false,
          crawlLinks: true,
          filter: ({ path }) => !path.startsWith("/app"),
        },
      }),
      react(),
    ],
  };
});
