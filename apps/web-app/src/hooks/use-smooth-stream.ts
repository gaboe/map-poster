import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const TYPEWRITER_SPEED_MS = 3; // target milliseconds per character

export const useSmoothStream = () => {
  const [parts, setParts] = useState<string[]>([]);
  const [stream, setStream] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const mountedRef = useRef(true);

  const setAnimatingState = useCallback(
    (value: boolean) => {
      if (mountedRef.current) {
        setIsAnimating(value);
      }
    },
    [setIsAnimating]
  );

  const frame = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeAccumulatorRef = useRef<number>(0);
  const streamIndexRef = useRef<number>(0);

  const requestFrame = useCallback(
    (cb: FrameRequestCallback) => {
      if (typeof window === "undefined") {
        return setTimeout(
          () => cb(Date.now()),
          16
        ) as unknown as number;
      }

      if (
        typeof window.requestAnimationFrame === "function"
      ) {
        return window.requestAnimationFrame(cb);
      }

      return window.setTimeout(
        () => cb(window.performance?.now() ?? Date.now()),
        16
      ) as unknown as number;
    },
    []
  );

  const cancelFrame = useCallback((id: number) => {
    if (typeof window === "undefined") {
      clearTimeout(id);
      return;
    }

    if (typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(id);
      return;
    }

    window.clearTimeout(id);
  }, []);

  const addPart = useCallback((part: string) => {
    if (part) {
      setParts((prev) => [...prev, part]);
    }
  }, []);

  const reset = useCallback(() => {
    setParts([]);
    setStream("");
    streamIndexRef.current = 0;
    if (frame.current !== null) {
      cancelFrame(frame.current);
      frame.current = null;
    }
    lastTimeRef.current = 0;
    timeAccumulatorRef.current = 0;
    isAnimatingRef.current = false;
    setAnimatingState(false);
  }, [cancelFrame, setAnimatingState]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (frame.current !== null) {
        cancelFrame(frame.current);
        frame.current = null;
      }
      isAnimatingRef.current = false;
    };
  }, [cancelFrame]);

  useEffect(() => {
    if (isAnimatingRef.current) return;

    const fullText = parts.join("");

    if (streamIndexRef.current >= fullText.length) {
      setStream(fullText);
      isAnimatingRef.current = false;
      setAnimatingState(false);
      return;
    }

    if (fullText.length === 0) {
      setStream("");
      isAnimatingRef.current = false;
      setAnimatingState(false);
      return;
    }

    isAnimatingRef.current = true;
    setAnimatingState(true);
    lastTimeRef.current = 0;
    timeAccumulatorRef.current = 0;

    const runFrame = (time: number) => {
      if (!mountedRef.current) {
        return;
      }

      const hasStarted = lastTimeRef.current !== 0;
      const delta = hasStarted
        ? time - lastTimeRef.current
        : TYPEWRITER_SPEED_MS;
      lastTimeRef.current = time;
      timeAccumulatorRef.current += delta;

      if (
        timeAccumulatorRef.current >= TYPEWRITER_SPEED_MS
      ) {
        const charsToAdvance = Math.max(
          1,
          Math.floor(
            timeAccumulatorRef.current / TYPEWRITER_SPEED_MS
          )
        );

        const nextIndex = Math.min(
          fullText.length,
          streamIndexRef.current + charsToAdvance
        );

        if (nextIndex !== streamIndexRef.current) {
          timeAccumulatorRef.current -=
            (nextIndex - streamIndexRef.current) *
            TYPEWRITER_SPEED_MS;
          streamIndexRef.current = nextIndex;
          setStream(fullText.slice(0, nextIndex));
        }
      }

      if (streamIndexRef.current < fullText.length) {
        frame.current = requestFrame(runFrame);
      } else {
        isAnimatingRef.current = false;
        setAnimatingState(false);
      }
    };

    frame.current = requestFrame(runFrame);

    return () => {
      if (frame.current !== null) {
        cancelFrame(frame.current);
        frame.current = null;
      }
      isAnimatingRef.current = false;
      setAnimatingState(false);
    };
  }, [parts, requestFrame, cancelFrame, setAnimatingState]);

  return { stream, addPart, reset, isAnimating };
};
