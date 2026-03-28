"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

const CANVAS_W = 640;
const CANVAS_H = 320;

const PEN_COLOR = "#004b44";

export type DrawingPadHandle = {
  getPngBase64OrNull: () => string | null;
};

type DrawingPadProps = {
  className?: string;
  initialPngBase64?: string | null;
};

function paintWhite(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function applyPen(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = PEN_COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

export const DrawingPad = forwardRef<DrawingPadHandle, DrawingPadProps>(function DrawingPad(
  { className, initialPngBase64 },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirtyRef = useRef(false);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    getPngBase64OrNull: () => {
      const canvas = canvasRef.current;
      if (!canvas || !dirtyRef.current) return null;
      const dataUrl = canvas.toDataURL("image/png");
      const prefix = "data:image/png;base64,";
      return dataUrl.startsWith(prefix) ? dataUrl.slice(prefix.length) : null;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finishSetup = () => {
      applyPen(ctx);
    };

    paintWhite(ctx);
    applyPen(ctx);

    if (initialPngBase64) {
      const img = new Image();
      img.onload = () => {
        paintWhite(ctx);
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        applyPen(ctx);
        dirtyRef.current = true;
      };
      img.onerror = () => {
        dirtyRef.current = false;
        finishSetup();
      };
      img.src = `data:image/png;base64,${initialPngBase64}`;
    } else {
      dirtyRef.current = false;
      finishSetup();
    }
  }, [initialPngBase64]);

  function canvasCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    dirtyRef.current = true;
    const { x, y } = canvasCoords(e);
    lastRef.current = { x, y };
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastRef.current) return;
    const { x, y } = canvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastRef.current = { x, y };
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    lastRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    paintWhite(ctx);
    applyPen(ctx);
    dirtyRef.current = false;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">그림</span>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        >
          전체 지우기
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="touch-none w-full max-w-full cursor-crosshair rounded-xl border border-slate-200 bg-white dark:border-slate-600"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
      <p className="text-xs text-slate-400 dark:text-slate-500">
        마우스나 손가락으로 그려 보세요. 저장 시 함께 올라갑니다.
      </p>
    </div>
  );
});
