"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Tool = "erase" | "restore";

type ManualMaskEditorProps = {
  resultUrl: string;
  restoreBlob: Blob;
  onApply: (blob: Blob) => void;
  onClose: () => void;
};

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("manual-edit-export-failed")),
      "image/png",
    );
  });
}

export function ManualMaskEditor({
  resultUrl,
  restoreBlob,
  onApply,
  onClose,
}: ManualMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restoreBitmapRef = useRef<ImageBitmap | null>(null);
  const undoRef = useRef<ImageData | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(48);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let editedBitmap: ImageBitmap | null = null;
    let restoreBitmap: ImageBitmap | null = null;

    const prepare = async () => {
      const editedBlob = await fetch(resultUrl).then((response) =>
        response.blob(),
      );
      [editedBitmap, restoreBitmap] = await Promise.all([
        createImageBitmap(editedBlob),
        createImageBitmap(restoreBlob),
      ]);
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = editedBitmap.width;
      canvas.height = editedBitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(editedBitmap, 0, 0);
      restoreBitmapRef.current = restoreBitmap;
      setReady(true);
    };

    void prepare();
    return () => {
      cancelled = true;
      editedBitmap?.close();
      restoreBitmap?.close();
      restoreBitmapRef.current = null;
    };
  }, [restoreBlob, resultUrl]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const restoreBitmap = restoreBitmapRef.current;
    if (!canvas || !restoreBitmap) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const displayWidth = Math.max(1, canvas.getBoundingClientRect().width);
    const radius = (brushSize * canvas.width) / displayWidth / 2;

    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();
    if (tool === "erase") {
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0,0,0,1)";
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    } else {
      context.globalCompositeOperation = "source-over";
      context.drawImage(restoreBitmap, 0, 0, canvas.width, canvas.height);
    }
    context.restore();
  };

  const drawLine = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const displayWidth = Math.max(1, canvas.getBoundingClientRect().width);
    const step = Math.max(1, (brushSize * canvas.width) / displayWidth / 5);
    const segments = Math.max(1, Math.ceil(distance / step));
    for (let index = 1; index <= segments; index += 1) {
      const ratio = index / segments;
      drawPoint(
        from.x + (to.x - from.x) * ratio,
        from.y + (to.y - from.y) * ratio,
      );
    }
  };

  const onPointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!ready) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    undoRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
    setCanUndo(true);
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    lastPointRef.current = point;
    drawPoint(point.x, point.y);
  };

  const onPointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    const lastPoint = lastPointRef.current;
    if (lastPoint) drawLine(lastPoint, point);
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const snapshot = undoRef.current;
    if (!canvas || !snapshot) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.putImageData(snapshot, 0, 0);
    undoRef.current = null;
    setCanUndo(false);
  };

  const apply = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      onApply(await canvasToBlob(canvas));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mask-editor-backdrop" role="dialog" aria-modal="true">
      <section className="mask-editor">
        <div className="mask-editor-head">
          <div>
            <span className="step-kicker">手动修边</span>
            <h3>擦掉杂点，恢复缺失边缘</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭手动修边">
            ×
          </button>
        </div>

        <div className="mask-editor-stage checkerboard">
          <canvas
            ref={canvasRef}
            aria-label="手动修边画布"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
          />
          {!ready && <span>正在准备高清画布…</span>}
        </div>

        <div className="mask-editor-tools">
          <div className="tool-switch" aria-label="修边工具">
            <button
              type="button"
              className={tool === "erase" ? "is-active" : ""}
              aria-pressed={tool === "erase"}
              onClick={() => setTool("erase")}
            >
              擦除杂点
            </button>
            <button
              type="button"
              className={tool === "restore" ? "is-active" : ""}
              aria-pressed={tool === "restore"}
              onClick={() => setTool("restore")}
            >
              恢复边缘
            </button>
          </div>
          <label>
            画笔
            <input
              type="range"
              min="12"
              max="120"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
            <strong>{brushSize}px</strong>
          </label>
          <button type="button" disabled={!canUndo} onClick={undo}>
            撤销上一步
          </button>
        </div>

        <div className="mask-editor-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            取消
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!ready || saving}
            onClick={() => void apply()}
          >
            {saving ? "正在保存…" : "应用修边"}
          </button>
        </div>
      </section>
    </div>
  );
}
