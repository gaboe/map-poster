import { describe, expect, vi, test } from "vitest";
import {
  createLogger,
  createLoggerInstance,
} from "../index";
import type { Logger } from "../index";

type BaseLogger = {
  child: (bindings: Record<string, unknown>) => unknown;
};

type CreateOpts = NonNullable<
  Parameters<typeof createLoggerInstance>[0]
>;
type Deps = NonNullable<CreateOpts["deps"]>;
type BuildPinoRollDep = NonNullable<Deps["buildPinoRoll"]>;
type PinoDep = NonNullable<Deps["pino"]>;
type PinoPrettyDep = NonNullable<Deps["pinoPretty"]>;
type StderrDep = NonNullable<Deps["stderr"]>;

describe("logger", () => {
  test("createLogger uses baseLogger.child", () => {
    const child = vi.fn(() => ({ child: true }));

    const baseLogger = {
      child,
    } satisfies BaseLogger;

    const result = createLogger(
      { requestId: "123" },
      baseLogger as unknown as Logger
    );

    expect(child).toHaveBeenCalledWith({
      requestId: "123",
    });
    expect(result as unknown).toEqual({ child: true });
  });

  test("createLoggerInstance production calls pino-roll", async () => {
    const buildPinoRoll = vi.fn(async () => ({
      stream: true,
    }));

    const pinoFn = vi.fn(
      (_opts: unknown, _stream?: unknown) =>
        ({
          child: vi.fn(() => ({ child: true })),
        }) as unknown
    );

    const pinoWithMulti = Object.assign(pinoFn, {
      multistream: vi.fn((_streams: unknown) => ({
        multi: true,
      })),
    });

    const stderr = {
      error: vi.fn(() => undefined),
    };

    await createLoggerInstance({
      env: {
        ENVIRONMENT: "prod",
        LOG_LEVEL: "info",
      } as NodeJS.ProcessEnv,
      deps: {
        buildPinoRoll:
          buildPinoRoll as unknown as BuildPinoRollDep,
        cwd: "/tmp",
        pino: pinoWithMulti as unknown as PinoDep,
        pinoPretty: vi.fn(() => ({
          pretty: true,
        })) as unknown as PinoPrettyDep,
        stderr: stderr as unknown as StderrDep,
      },
    });

    expect(buildPinoRoll).toHaveBeenCalled();
    expect(pinoFn).toHaveBeenCalled();
  });

  test("createLoggerInstance development falls back when build fails", async () => {
    const buildPinoRoll = vi.fn(async () => {
      throw new Error("roll failed");
    });

    const pinoFn = vi.fn(
      (_opts: unknown, _stream?: unknown) =>
        ({
          child: vi.fn(() => ({ child: true })),
        }) as unknown
    );

    const pinoWithMulti = Object.assign(pinoFn, {
      multistream: vi.fn((_streams: unknown) => ({
        multi: true,
      })),
    });

    const stderr = {
      error: vi.fn(() => undefined),
    };

    await createLoggerInstance({
      env: {
        ENVIRONMENT: "dev",
        LOG_LEVEL: "debug",
      } as NodeJS.ProcessEnv,
      deps: {
        buildPinoRoll:
          buildPinoRoll as unknown as BuildPinoRollDep,
        cwd: "/tmp",
        pino: pinoWithMulti as unknown as PinoDep,
        pinoPretty: vi.fn(() => ({
          pretty: true,
        })) as unknown as PinoPrettyDep,
        stderr: stderr as unknown as StderrDep,
      },
    });

    expect(buildPinoRoll).toHaveBeenCalled();
    expect(stderr.error).toHaveBeenCalled();
    expect(pinoFn).toHaveBeenCalled();
  });
});
