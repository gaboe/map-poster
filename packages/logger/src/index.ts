/// <reference types="./pino-roll" />
import pino from "pino";
import buildPinoRoll from "pino-roll";
import pinoPretty from "pino-pretty";
import { z } from "zod";

type LogLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

type Dependencies = {
  readonly buildPinoRoll: typeof buildPinoRoll;
  readonly cwd: string;
  readonly pino: typeof pino;
  readonly pinoPretty: typeof pinoPretty;
  readonly stderr: {
    readonly error: typeof console.error;
  };
};

type CreateLoggerInstanceOptions = {
  readonly env: NodeJS.ProcessEnv;
  readonly deps?: Partial<Dependencies>;
};

const envSchema = z.object({
  LOG_LEVEL: z
    .enum([
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
    ])
    .optional(),
});

function resolveDependencies(
  deps?: Partial<Dependencies>
): Dependencies {
  return {
    buildPinoRoll: deps?.buildPinoRoll ?? buildPinoRoll,
    cwd: deps?.cwd ?? process.cwd(),
    pino: deps?.pino ?? pino,
    pinoPretty: deps?.pinoPretty ?? pinoPretty,
    stderr: deps?.stderr ?? { error: console.error },
  };
}

async function createProductionLogger(
  deps: Dependencies,
  logLevel: LogLevel
) {
  try {
    const fileStream = await deps.buildPinoRoll({
      file: "/app/logs/app.log",
      frequency: "daily",
      size: "50M",
      dateFormat: "yyyy-MM-dd",
      extension: ".log",
      mkdir: true,
    });

    // Always log to both stdout (for kubectl logs) and file (for persistence)
    const streams = [
      { level: logLevel, stream: process.stdout },
      { level: logLevel, stream: fileStream },
    ];

    return deps.pino(
      {
        level: logLevel,
      },
      deps.pino.multistream(streams)
    );
  } catch (error) {
    // deps.stderr used here - logger not available during initialization
    deps.stderr.error(
      "Failed to initialize file logger, falling back to stdout:",
      error
    );

    return deps.pino({ level: logLevel });
  }
}

async function createDevelopmentLogger(
  deps: Dependencies,
  logLevel: LogLevel
) {
  try {
    const prettyStream = deps.pinoPretty({
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    });

    const fileStream = await deps.buildPinoRoll({
      file: `${deps.cwd}/logs/app.log`,
      frequency: "daily",
      size: "50M",
      dateFormat: "yyyy-MM-dd",
      extension: ".log",
      mkdir: true,
    });

    const streams = [
      { level: "debug", stream: prettyStream },
      { level: "debug", stream: fileStream },
    ];

    return deps.pino(
      {
        level: logLevel,
      },
      deps.pino.multistream(streams)
    );
  } catch (error) {
    deps.stderr.error(
      "Failed to initialize development logger:",
      error
    );

    return deps.pino({
      level: logLevel,
    });
  }
}

export async function createLoggerInstance(
  options?: Partial<CreateLoggerInstanceOptions>
) {
  const env = options?.env ?? process.env;
  const deps = resolveDependencies(options?.deps);

  const parsedEnv = envSchema.parse(env);

  const environment = env["ENVIRONMENT"] ?? "dev";
  const logLevel =
    parsedEnv.LOG_LEVEL ??
    (environment === "prod" || environment === "test"
      ? "info"
      : "debug");

  const isProduction =
    environment === "prod" || environment === "test";

  return isProduction
    ? createProductionLogger(deps, logLevel)
    : createDevelopmentLogger(deps, logLevel);
}

export const logger = await createLoggerInstance();

export function createLogger(
  bindings: Record<string, unknown>,
  baseLogger: Logger = logger
) {
  return baseLogger.child(bindings);
}

export type Logger = typeof logger;
