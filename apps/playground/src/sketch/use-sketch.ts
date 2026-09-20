import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useMatchbox } from "@matchbox-ai/core/react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
import type { Point } from "../../../../examples/sketch/matchbox/shapes/parser";
import type { Shape } from "../../../../examples/sketch/matchbox/shapes/geometry/shape";
import { recognize } from "../../../../examples/sketch/matchbox/shapes/recognize";
import { draw, type Drawing } from "./draw";
const loadShapes = () => import("../../../../examples/sketch/.matchbox/shapes/model.matchbox");
export function useSketch() {
  const parser = useMatchbox(loadShapes);
  const canvas = useRef<HTMLCanvasElement>(null);
  const draft = useRef<Point[]>([]);
  const pointer = useRef<number | null>(null);
  const revision = useRef(0);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [originals, setOriginals] = useState(true);
  const [result, setResult] = useState<ParseResult<Shape> | null>(null);
  const [message, setMessage] = useState("Draw in one stroke.");
  const [busy, setBusy] = useState(false);
  const repaint = useCallback(() => {
    if (canvas.current) {
      draw(canvas.current, drawings, draft.current, originals);
    }
  }, [drawings, originals]);
  useEffect(() => {
    repaint();
    const observer = new ResizeObserver(repaint);
    if (canvas.current) {
      observer.observe(canvas.current);
    }
    return () => observer.disconnect();
  }, [repaint]);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  const submit = async (points: Point[]) => {
    const current = ++revision.current;
    setBusy(true);
    setResult(null);
    setMessage("Recognizing…");
    try {
      const prediction = await recognize(parser, { points });
      if (current !== revision.current) {
        return;
      }
      setResult(prediction);
      setDrawings((previous) => [
        ...previous,
        prediction.status === "ok" ? { points, shape: prediction.value } : { points },
      ]);
      setMessage(
        prediction.status === "ok" ? `Recognized ${prediction.value.kind}.` : "Kept your stroke.",
      );
    } catch (error) {
      if (current === revision.current) {
        setDrawings((previous) => [...previous, { points }]);
        setMessage(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (current === revision.current) {
        setBusy(false);
      }
    }
  };
  function position(event: PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000)),
      y: Math.max(0, Math.min(600, ((event.clientY - rect.top) / rect.height) * 600)),
    };
  }
  return {
    canvas,
    drawings,
    originals,
    setOriginals,
    result,
    message,
    busy,
    ready: parser.status === "ready",
    error: parser.error,
    submit,
    undo() {
      revision.current++;
      setBusy(false);
      setDrawings((previous) => previous.slice(0, -1));
      setResult(null);
      setMessage("Draw in one stroke.");
    },
    clear() {
      revision.current++;
      setBusy(false);
      draft.current = [];
      setDrawings([]);
      setResult(null);
      setMessage("Draw in one stroke.");
    },
    pointerDown(event: PointerEvent<HTMLCanvasElement>) {
      if (busy || parser.status !== "ready" || pointer.current !== null || event.button !== 0) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      pointer.current = event.pointerId;
      draft.current = [position(event)];
      repaint();
    },
    pointerMove(event: PointerEvent<HTMLCanvasElement>) {
      if (pointer.current !== event.pointerId) {
        return;
      }
      if (draft.current.length < 4095) {
        draft.current.push(position(event));
      }
      repaint();
    },
    pointerUp(event: PointerEvent<HTMLCanvasElement>) {
      if (pointer.current !== event.pointerId) {
        return;
      }
      const points = [...draft.current, position(event)];
      draft.current = [];
      pointer.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      if (points.length >= 3) {
        void submit(points);
      }
      repaint();
    },
    pointerCancel() {
      draft.current = [];
      pointer.current = null;
      repaint();
    },
  };
}
