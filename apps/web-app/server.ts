/**
 * TanStack Start Production Server with Bun
 * https://github.com/TanStack/router/tree/main/examples/react/start-bun
 *
 * A high-performance production server for TanStack Start applications that
 * implements intelligent static asset loading with configurable memory management.
 *
 * Features:
 * - Hybrid loading strategy (preload small files, serve large files on-demand)
 * - Configurable file filtering with include/exclude patterns
 * - Memory-efficient response generation
 * - Production-ready caching headers
 *
 * Environment Variables:
 *
 * PORT (number)
 *   - Server port number
 *   - Default: 3000
 *
 * ASSET_PRELOAD_MAX_SIZE (number)
 *   - Maximum file size in bytes to preload into memory
 *   - Files larger than this will be served on-demand from disk
 *   - Default: 5242880 (5MB)
 *   - Example: ASSET_PRELOAD_MAX_SIZE=10485760 (10MB)
 *
 * ASSET_PRELOAD_INCLUDE_PATTERNS (string)
 *   - Comma-separated list of glob patterns for files to include
 *   - If specified, only matching files are eligible for preloading
 *   - Patterns are matched against filenames only, not full paths
 *   - Example: ASSET_PRELOAD_INCLUDE_PATTERNS="*.js,*.css,*.woff2"
 *
 * ASSET_PRELOAD_EXCLUDE_PATTERNS (string)
 *   - Comma-separated list of glob patterns for files to exclude
 *   - Applied after include patterns
 *   - Patterns are matched against filenames only, not full paths
 *   - Example: ASSET_PRELOAD_EXCLUDE_PATTERNS="*.map,*.txt"
 *
 * ASSET_PRELOAD_VERBOSE_LOGGING (boolean)
 *   - Enable detailed logging of loaded and skipped files
 *   - Default: false
 *   - Set to "true" to enable verbose output
 *
 * ASSET_PRELOAD_ENABLE_ETAG (boolean)
 *   - Enable ETag generation for preloaded assets
 *   - Default: true
 *   - Set to "false" to disable ETag support
 *
 * ASSET_PRELOAD_ENABLE_GZIP (boolean)
 *   - Enable Gzip compression for eligible assets
 *   - Default: true
 *   - Set to "false" to disable Gzip compression
 *
 * ASSET_PRELOAD_GZIP_MIN_SIZE (number)
 *   - Minimum file size in bytes required for Gzip compression
 *   - Files smaller than this will not be compressed
 *   - Default: 1024 (1KB)
 *
 * ASSET_PRELOAD_GZIP_MIME_TYPES (string)
 *   - Comma-separated list of MIME types eligible for Gzip compression
 *   - Supports partial matching for types ending with "/"
 *   - Default: text/,application/javascript,application/json,application/xml,image/svg+xml
 *
 * Usage:
 *   bun run server.ts
 */

import { Buffer } from "node:buffer";
import path from "node:path";
import { logger } from "@map-poster/logger";

// Bun prints AbortError stacktraces to stderr before user error handlers get a
// chance to filter them. We intercept stderr writes and drop lines belonging to
// this known-noisy scenario while leaving all other logs untouched.
const originalStderrWrite = process.stderr.write.bind(
  process.stderr
);
let abortErrorBuffer = "";
let inAbortErrorBlock = false;
let suppressedAbortErrorCount = 0;

const isAbortErrorLoggingEnabled =
  (process.env.ABORT_ERROR_LOGGING ?? "true") === "true";

const reportSuppressedAbortError = () => {
  suppressedAbortErrorCount += 1;
  if (!isAbortErrorLoggingEnabled) {
    return;
  }
  originalStderrWrite(
    `[abort-error-filter] suppressed client disconnect stack trace (count=${suppressedAbortErrorCount})\n`
  );
};

const decodeChunk = (
  value: unknown,
  encoding?: BufferEncoding
): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString(encoding ?? "utf8");
  }
  if (
    ArrayBuffer.isView(value) &&
    !(value instanceof Uint8Array)
  ) {
    return Buffer.from(
      value.buffer,
      value.byteOffset,
      value.byteLength
    ).toString(encoding ?? "utf8");
  }
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value).toString(encoding ?? "utf8");
  }
  return String(value);
};

const isAbortErrorStartLine = (line: string) =>
  line.includes("error: The connection was closed.") ||
  (line.includes("The connection was closed") &&
    (line.includes("AbortError") ||
      line.includes("DOMException")));

const isAbortErrorContinuationLine = (line: string) => {
  const trimmed = line.trimStart();
  if (trimmed.length === 0) {
    return true;
  }
  return (
    trimmed.startsWith("at ") ||
    trimmed.startsWith("at/") ||
    trimmed.startsWith("cause: DOMException") ||
    (trimmed.startsWith("DOMException") &&
      trimmed.includes("AbortError")) ||
    (trimmed.includes("AbortError") &&
      trimmed.includes("The connection was closed"))
  );
};

const handleAbortErrorChunk = (chunk: string) => {
  abortErrorBuffer += chunk;

  let output = "";
  let newlineIndex = abortErrorBuffer.indexOf("\n");

  while (newlineIndex !== -1) {
    const lineWithNewline = abortErrorBuffer.slice(
      0,
      newlineIndex + 1
    );
    abortErrorBuffer = abortErrorBuffer.slice(
      newlineIndex + 1
    );

    if (
      !inAbortErrorBlock &&
      isAbortErrorStartLine(lineWithNewline)
    ) {
      inAbortErrorBlock = true;
      reportSuppressedAbortError();
      newlineIndex = abortErrorBuffer.indexOf("\n");
      continue;
    }

    if (inAbortErrorBlock) {
      if (isAbortErrorContinuationLine(lineWithNewline)) {
        newlineIndex = abortErrorBuffer.indexOf("\n");
        continue;
      }
      inAbortErrorBlock = false;
      if (isAbortErrorStartLine(lineWithNewline)) {
        inAbortErrorBlock = true;
        reportSuppressedAbortError();
        newlineIndex = abortErrorBuffer.indexOf("\n");
        continue;
      }
    }

    output += lineWithNewline;
    newlineIndex = abortErrorBuffer.indexOf("\n");
  }

  const trimmedBufferStart = abortErrorBuffer.trimStart();
  const shouldHoldBuffer =
    inAbortErrorBlock ||
    (trimmedBufferStart.length > 0 &&
      ("error: The connection was closed.".startsWith(
        trimmedBufferStart
      ) ||
        trimmedBufferStart.startsWith("AbortError") ||
        trimmedBufferStart.startsWith("DOMException")));

  if (!shouldHoldBuffer && abortErrorBuffer.length > 0) {
    output += abortErrorBuffer;
    abortErrorBuffer = "";
  }

  return output;
};

process.stderr.write = function abortErrorFilteredWrite(
  chunk: unknown,
  encodingOrCallback?:
    | BufferEncoding
    | ((error?: Error | null) => void),
  maybeCallback?: (error?: Error | null) => void
) {
  let encoding: BufferEncoding | undefined;
  let callback:
    | ((error?: Error | null) => void)
    | undefined;

  if (typeof encodingOrCallback === "string") {
    encoding = encodingOrCallback;
    if (typeof maybeCallback === "function") {
      callback = maybeCallback;
    }
  } else if (typeof encodingOrCallback === "function") {
    callback = encodingOrCallback;
  }

  const output = handleAbortErrorChunk(
    decodeChunk(chunk, encoding)
  );

  if (output.length > 0) {
    return originalStderrWrite.call(
      process.stderr,
      output,
      encoding,
      callback
    );
  }

  if (typeof callback === "function") {
    callback();
  }

  return true;
};

if (typeof Bun !== "undefined") {
  const stderrFile = Bun.stderr as {
    write: (data: unknown) => unknown;
  };

  if (
    stderrFile &&
    typeof stderrFile.write === "function"
  ) {
    const originalBunStderrWrite =
      stderrFile.write.bind(stderrFile);

    stderrFile.write = (chunk: unknown) => {
      const output = handleAbortErrorChunk(
        decodeChunk(chunk)
      );
      return originalBunStderrWrite(
        output.length > 0 ? output : ""
      );
    };
  }

  if (typeof Bun.write === "function") {
    const originalBunWrite = Bun.write.bind(Bun) as (
      ...writeArgs: unknown[]
    ) => ReturnType<typeof Bun.write>;

    const patchedBunWrite = (
      destination: unknown,
      data: unknown,
      ...args: unknown[]
    ): ReturnType<typeof Bun.write> => {
      if (destination === Bun.stderr) {
        const output = handleAbortErrorChunk(
          decodeChunk(data)
        );
        return originalBunWrite(
          Bun.stderr,
          output.length > 0 ? output : "",
          ...args
        );
      }
      return originalBunWrite(destination, data, ...args);
    };

    Bun.write = patchedBunWrite as typeof Bun.write;
  }
}

// Suppress AbortError logs from client disconnections during SSR streaming
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const firstArg = args[0];

  // Direct DOMException AbortError
  if (
    firstArg instanceof DOMException &&
    firstArg.name === "AbortError"
  ) {
    return;
  }

  // String representation check
  const stringified = String(firstArg);
  if (
    stringified.includes("AbortError") &&
    stringified.includes("The connection was closed")
  ) {
    return;
  }

  // Check all arguments for AbortError (h3 error format)
  const allArgs = args.join(" ");
  if (
    allArgs.includes("AbortError") &&
    allArgs.includes("The connection was closed")
  ) {
    return;
  }

  originalConsoleError.apply(console, args);
};

process.on("unhandledRejection", (error) => {
  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return;
  }
  const errorStr = String(error);
  if (
    errorStr.includes("AbortError") &&
    errorStr.includes("The connection was closed")
  ) {
    return;
  }
  console.error("[Unhandled Rejection]", error);
});

process.on("uncaughtException", (error) => {
  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return;
  }
  const errorStr = String(error);
  if (
    errorStr.includes("AbortError") &&
    errorStr.includes("The connection was closed")
  ) {
    return;
  }
  console.error("[Uncaught Exception]", error);
});

// Configuration
const SERVER_PORT = Number(process.env.PORT ?? 3000);
const CLIENT_DIRECTORY = "./dist/client";
const SERVER_ENTRY_POINT = "./dist/server/server.js";

// Logging utilities for professional output
const log = {
  info: (message: string) => {
    logger.info(message);
  },
  success: (message: string) => {
    logger.info(message);
  },
  warning: (message: string) => {
    logger.warn(message);
  },
  error: (message: string) => {
    logger.error(message);
  },
  header: (message: string) => {
    logger.info(`\n${message}\n`);
  },
};

// Preloading configuration from environment variables
const MAX_PRELOAD_BYTES = Number(
  process.env.ASSET_PRELOAD_MAX_SIZE ?? 5 * 1024 * 1024
);

// Parse comma-separated include patterns (no defaults)
const INCLUDE_PATTERNS = (
  process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pattern: string) => convertGlobToRegExp(pattern));

// Parse comma-separated exclude patterns (no defaults)
const EXCLUDE_PATTERNS = (
  process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pattern: string) => convertGlobToRegExp(pattern));

// Verbose logging flag
const VERBOSE =
  process.env.ASSET_PRELOAD_VERBOSE_LOGGING === "true";

// Optional ETag feature
const ENABLE_ETAG =
  (process.env.ASSET_PRELOAD_ENABLE_ETAG ?? "true") ===
  "true";

// Optional Gzip feature
const ENABLE_GZIP =
  (process.env.ASSET_PRELOAD_ENABLE_GZIP ?? "true") ===
  "true";
const GZIP_MIN_BYTES = Number(
  process.env.ASSET_PRELOAD_GZIP_MIN_SIZE ?? 1024
);
const GZIP_TYPES = (
  process.env.ASSET_PRELOAD_GZIP_MIME_TYPES ??
  "text/,application/javascript,application/json,application/xml,image/svg+xml"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

/**
 * Convert a simple glob pattern to a regular expression
 * Supports * wildcard for matching any characters
 */
function convertGlobToRegExp(globPattern: string): RegExp {
  const escapedPattern = globPattern
    .replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escapedPattern}$`, "i");
}

/**
 * Compute ETag for a given data buffer
 */
function computeEtag(data: Uint8Array): string {
  const hash = Bun.hash(data);
  return `W/"${hash.toString(16)}-${data.byteLength.toString()}"`;
}

/**
 * Metadata for preloaded static assets
 */
interface AssetMetadata {
  route: string;
  size: number;
  type: string;
}

/**
 * In-memory asset with ETag and Gzip support
 */
interface InMemoryAsset {
  raw: Uint8Array;
  gz?: Uint8Array | undefined;
  etag?: string | undefined;
  type: string;
  immutable: boolean;
  size: number;
}

/**
 * Result of static asset preloading process
 */
interface PreloadResult {
  routes: Record<
    string,
    (req: Request) => Response | Promise<Response>
  >;
  loaded: AssetMetadata[];
  skipped: AssetMetadata[];
}

/**
 * Check if a file is eligible for preloading based on configured patterns
 */
function isFileEligibleForPreloading(
  relativePath: string
): boolean {
  const fileName =
    relativePath.split(/[/\\]/).pop() ?? relativePath;

  if (INCLUDE_PATTERNS.length > 0) {
    if (
      !INCLUDE_PATTERNS.some((pattern) =>
        pattern.test(fileName)
      )
    ) {
      return false;
    }
  }

  if (
    EXCLUDE_PATTERNS.some((pattern) =>
      pattern.test(fileName)
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Check if a MIME type is compressible
 */
function isMimeTypeCompressible(mimeType: string): boolean {
  return GZIP_TYPES.some((type) =>
    type.endsWith("/")
      ? mimeType.startsWith(type)
      : mimeType === type
  );
}

/**
 * Conditionally compress data based on size and MIME type
 */
function compressDataIfAppropriate(
  data: Uint8Array,
  mimeType: string
): Uint8Array | undefined {
  if (!ENABLE_GZIP) return undefined;
  if (data.byteLength < GZIP_MIN_BYTES) return undefined;
  if (!isMimeTypeCompressible(mimeType)) return undefined;
  try {
    return Bun.gzipSync(data.buffer as ArrayBuffer);
  } catch {
    return undefined;
  }
}

/**
 * Create response handler function with ETag and Gzip support
 */
function createResponseHandler(
  asset: InMemoryAsset
): (req: Request) => Response {
  return (req: Request) => {
    const headers: Record<string, string> = {
      "Content-Type": asset.type,
      "Cache-Control": asset.immutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    };

    if (ENABLE_ETAG && asset.etag) {
      const ifNone = req.headers.get("if-none-match");
      if (ifNone && ifNone === asset.etag) {
        return new Response(null, {
          status: 304,
          headers: { ETag: asset.etag },
        });
      }
      headers.ETag = asset.etag;
    }

    if (
      ENABLE_GZIP &&
      asset.gz &&
      req.headers.get("accept-encoding")?.includes("gzip")
    ) {
      headers["Content-Encoding"] = "gzip";
      headers["Content-Length"] = String(
        asset.gz.byteLength
      );
      const gzCopy = new Uint8Array(asset.gz);
      return new Response(gzCopy, { status: 200, headers });
    }

    headers["Content-Length"] = String(
      asset.raw.byteLength
    );
    const rawCopy = new Uint8Array(asset.raw);
    return new Response(rawCopy, { status: 200, headers });
  };
}

/**
 * Create composite glob pattern from include patterns
 */
function createCompositeGlobPattern(): Bun.Glob {
  const raw = (
    process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const pattern =
    raw.length === 0
      ? "**/*"
      : raw.length === 1
        ? raw[0]!
        : `{${raw.join(",")}}`;

  return new Bun.Glob(pattern);
}

/**
 * Initialize static routes with intelligent preloading strategy
 */
async function initializeStaticRoutes(
  clientDirectory: string
): Promise<PreloadResult> {
  const routes: Record<
    string,
    (req: Request) => Response | Promise<Response>
  > = {};
  const loaded: AssetMetadata[] = [];
  const skipped: AssetMetadata[] = [];

  log.info(
    `Loading static assets from ${clientDirectory}...`
  );
  if (VERBOSE) {
    console.log(
      `Max preload size: ${(MAX_PRELOAD_BYTES / 1024 / 1024).toFixed(2)} MB`
    );
    if (INCLUDE_PATTERNS.length > 0) {
      console.log(
        `Include patterns: ${process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? ""}`
      );
    }
    if (EXCLUDE_PATTERNS.length > 0) {
      console.log(
        `Exclude patterns: ${process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? ""}`
      );
    }
  }

  let totalPreloadedBytes = 0;

  try {
    const glob = createCompositeGlobPattern();
    for await (const relativePath of glob.scan({
      cwd: clientDirectory,
    })) {
      const filepath = path.join(
        clientDirectory,
        relativePath
      );
      const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`;

      try {
        const file = Bun.file(filepath);

        if (!(await file.exists()) || file.size === 0) {
          continue;
        }

        const metadata: AssetMetadata = {
          route,
          size: file.size,
          type: file.type || "application/octet-stream",
        };

        const matchesPattern =
          isFileEligibleForPreloading(relativePath);
        const withinSizeLimit =
          file.size <= MAX_PRELOAD_BYTES;

        if (matchesPattern && withinSizeLimit) {
          const bytes = new Uint8Array(
            await file.arrayBuffer()
          );
          const gz = compressDataIfAppropriate(
            bytes,
            metadata.type
          );
          const etag = ENABLE_ETAG
            ? computeEtag(bytes)
            : undefined;
          const asset: InMemoryAsset = {
            raw: bytes,
            gz,
            etag,
            type: metadata.type,
            immutable: true,
            size: bytes.byteLength,
          };
          routes[route] = createResponseHandler(asset);

          loaded.push({
            ...metadata,
            size: bytes.byteLength,
          });
          totalPreloadedBytes += bytes.byteLength;
        } else {
          routes[route] = () => {
            const fileOnDemand = Bun.file(filepath);
            return new Response(fileOnDemand, {
              headers: {
                "Content-Type": metadata.type,
                "Cache-Control": "public, max-age=3600",
              },
            });
          };

          skipped.push(metadata);
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name !== "EISDIR"
        ) {
          log.error(
            `Failed to load ${filepath}: ${error.message}`
          );
        }
      }
    }

    if (
      VERBOSE &&
      (loaded.length > 0 || skipped.length > 0)
    ) {
      const allFiles = [...loaded, ...skipped].sort(
        (a, b) => a.route.localeCompare(b.route)
      );

      const maxPathLength = Math.min(
        Math.max(
          ...allFiles.map((file) => file.route.length)
        ),
        60
      );

      const formatFileSize = (
        bytes: number,
        gzBytes?: number
      ) => {
        const kb = bytes / 1024;
        const sizeStr =
          kb < 100 ? kb.toFixed(2) : kb.toFixed(1);

        if (gzBytes !== undefined) {
          const gzKb = gzBytes / 1024;
          const gzStr =
            gzKb < 100 ? gzKb.toFixed(2) : gzKb.toFixed(1);
          return {
            size: sizeStr,
            gzip: gzStr,
          };
        }

        const gzipKb = kb * 0.35;
        return {
          size: sizeStr,
          gzip:
            gzipKb < 100
              ? gzipKb.toFixed(2)
              : gzipKb.toFixed(1),
        };
      };

      if (loaded.length > 0) {
        console.log("\n📁 Preloaded into memory:");
        console.log(
          "Path                                          │    Size │ Gzip Size"
        );
        loaded
          .sort((a, b) => a.route.localeCompare(b.route))
          .forEach((file) => {
            const { size, gzip } = formatFileSize(
              file.size
            );
            const paddedPath =
              file.route.padEnd(maxPathLength);
            const sizeStr = `${size.padStart(7)} kB`;
            const gzipStr = `${gzip.padStart(7)} kB`;
            console.log(
              `${paddedPath} │ ${sizeStr} │  ${gzipStr}`
            );
          });
      }

      if (skipped.length > 0) {
        console.log("\n💾 Served on-demand:");
        console.log(
          "Path                                          │    Size │ Gzip Size"
        );
        skipped
          .sort((a, b) => a.route.localeCompare(b.route))
          .forEach((file) => {
            const { size, gzip } = formatFileSize(
              file.size
            );
            const paddedPath =
              file.route.padEnd(maxPathLength);
            const sizeStr = `${size.padStart(7)} kB`;
            const gzipStr = `${gzip.padStart(7)} kB`;
            console.log(
              `${paddedPath} │ ${sizeStr} │  ${gzipStr}`
            );
          });
      }
    }

    if (VERBOSE) {
      if (loaded.length > 0 || skipped.length > 0) {
        const allFiles = [...loaded, ...skipped].sort(
          (a, b) => a.route.localeCompare(b.route)
        );
        console.log("\n📊 Detailed file information:");
        console.log(
          "Status       │ Path                            │ MIME Type                    │ Reason"
        );
        allFiles.forEach((file) => {
          const isPreloaded = loaded.includes(file);
          const status = isPreloaded
            ? "MEMORY"
            : "ON-DEMAND";
          const reason =
            !isPreloaded && file.size > MAX_PRELOAD_BYTES
              ? "too large"
              : !isPreloaded
                ? "filtered"
                : "preloaded";
          const route =
            file.route.length > 30
              ? `${file.route.substring(0, 27)}...`
              : file.route;
          console.log(
            `${status.padEnd(12)} │ ${route.padEnd(30)} │ ${file.type.padEnd(28)} │ ${reason.padEnd(10)}`
          );
        });
      } else {
        console.log("\n📊 No files found to display");
      }
    }

    console.log();
    if (loaded.length > 0) {
      log.success(
        `Preloaded ${String(loaded.length)} files (${(totalPreloadedBytes / 1024 / 1024).toFixed(2)} MB) into memory`
      );
    } else {
      log.info("No files preloaded into memory");
    }

    if (skipped.length > 0) {
      const tooLarge = skipped.filter(
        (file) => file.size > MAX_PRELOAD_BYTES
      ).length;
      const filtered = skipped.length - tooLarge;
      log.info(
        `${String(skipped.length)} files will be served on-demand (${String(tooLarge)} too large, ${String(filtered)} filtered)`
      );
    }
  } catch (error) {
    log.error(
      `Failed to load static files from ${clientDirectory}: ${String(error)}`
    );
  }

  return { routes, loaded, skipped };
}

/**
 * Initialize the server
 */
async function initializeServer() {
  log.header("Starting Production Server");

  let handler: {
    fetch: (
      request: Request
    ) => Response | Promise<Response>;
  };
  try {
    const serverModule = (await import(
      SERVER_ENTRY_POINT
    )) as {
      default: {
        fetch: (
          request: Request
        ) => Response | Promise<Response>;
      };
    };
    handler = serverModule.default;
    log.success(
      "TanStack Start application handler initialized"
    );
  } catch (error) {
    log.error(
      `Failed to load server handler: ${String(error)}`
    );
    process.exit(1);
  }

  const { routes } = await initializeStaticRoutes(
    CLIENT_DIRECTORY
  );

  const server = Bun.serve({
    port: SERVER_PORT,

    routes: {
      // OG image .png extension handler (must be before ...routes)
      "/api/og/**/*.png": async (req: Request) => {
        try {
          const url = new URL(req.url);
          url.pathname = url.pathname.slice(0, -4); // Strip .png
          const modifiedReq = new Request(
            url.toString(),
            req
          );
          const response = await handler.fetch(modifiedReq);

          // Always force image/png Content-Type for OG image responses
          const newHeaders = new Headers(response.headers);
          newHeaders.set("Content-Type", "image/png");
          newHeaders.set(
            "Cache-Control",
            "public, max-age=3600"
          );

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return new Response(null, { status: 499 });
          }
          log.error(
            `OG image handler error: ${String(error)}`
          );
          return new Response(
            "Failed to generate OG image",
            {
              status: 500,
            }
          );
        }
      },
      ...routes,
      "/*": async (req: Request) => {
        try {
          const response = await handler.fetch(req);
          return normalizeResponse(response);
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return new Response(null, { status: 499 });
          }
          log.error(
            `Server handler error: ${String(error)}`
          );
          return new Response("Internal Server Error", {
            status: 500,
          });
        }
      },
    },

    error(error) {
      // Silently handle AbortErrors from client disconnections
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return new Response(null, { status: 499 });
      }

      // Check if error message contains AbortError
      const errorMessage = String(error);
      if (
        errorMessage.includes("AbortError") &&
        errorMessage.includes("The connection was closed")
      ) {
        return new Response(null, { status: 499 });
      }

      // Log other errors
      log.error(
        `Uncaught server error: ${error instanceof Error ? error.message : String(error)}`
      );
      return new Response("Internal Server Error", {
        status: 500,
      });
    },
  });

  log.success(
    `Server listening on http://localhost:${String(server.port)}`
  );
}

initializeServer().catch((error: unknown) => {
  log.error(`Failed to start server: ${String(error)}`);
  process.exit(1);
});

function normalizeResponse(response: Response): Response {
  const isNodeAdapterResponse =
    response !== undefined &&
    response !== null &&
    typeof (response as { nodeResponse?: unknown })
      .nodeResponse === "function";

  if (!isNodeAdapterResponse) {
    return response;
  }

  const headers = new Headers();
  response.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
