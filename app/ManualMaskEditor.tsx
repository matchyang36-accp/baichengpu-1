"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Tool = "erase" | "restore";
type Point = { x: number; y: number };
type Stroke = {
  tool: Tool;
  brushSize: number;
  points: Point[];
};

type ManualMaskEditorProps = {
  resultUrl: string;
  resultBlob?: Blob;
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
  resultBlob,
  restoreBlob,
  onApply,
  onClose,
}: ManualMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brushCursorRef = useRef<HTMLSpanElement>(null);
  const baseBitmapRef = useRef<ImageBitmap | null>(null);
  const restoreBitmapRef = useRef<ImageBitmap | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(48);
  const [ready, setReady] = useState(false);
  const [prepareError, setPrepareError] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let editedBitmap: ImageBitmap | null = null;
    let restoreBitmap: ImageBitmap | null = null;

    const prepare = async () => {
      setPrepareError(false);
      const editedBlob =
        resultBlob ??
        (await fetch(resultUrl).then((response) => {
          if (!response.ok) throw new Error("manual-edit-image-unavailable");
          return response.blob();
        }));
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
      baseBitmapRef.current = editedBitmap;
      restoreBitmapRef.current = restoreBitmap;
      strokesRef.current = [];
      activeStrokeRef.current = null;
      setCanUndo(false);
      setReady(true);
    };

    void prepare().catch((reason) => {
      console.error(reason);
      if (!cancelled) setPrepareError(true);
    });
    return () => {
      cancelled = true;
      editedBitmap?.close();
      restoreBitmap?.close();
      baseBitmapRef.current = null;
      restoreBitmapRef.current = null;
    };
  }, [restoreBlob, resultBlob, resultUrl]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const updateBrushCursor = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const cursor = brushCursorRef.current;
    if (!cursor || !ready || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    cursor.style.left = `${event.clientX - rect.left}px`;
    cursor.style.top = `${event.clientY - rect.top}px`;
    cursor.style.opacity = "1";
  };

  const hideBrushCursor = () => {
    if (brushCursorRef.current) {
      brushCursorRef.current.style.opacity = "0";
    }
  };

  const drawPoint = (
    x: number,
    y: number,
    selectedTool = tool,
    selectedBrushSize = brushSize,
  ) => {
    const canvas = canvasRef.current;
    const restoreBitmap = restoreBitmapRef.current;
    if (!canvas || !restoreBitmap) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const displayWidth = Math.max(1, canvas.getBoundingClientRect().width);
    const radius = (selectedBrushSize * canvas.width) / displayWidth / 2;

    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();
    if (selectedTool === "erase") {
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
    from: Point,
    to: Point,
    selectedTool = tool,
    selectedBrushSize = brushSize,
  ) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const displayWidth = Math.max(1, canvas.getBoundingClientRect().width);
    const step = Math.max(
      1,
      (selectedBrushSize * canvas.width) / displayWidth / 5,
    );
    const segments = Math.max(1, Math.ceil(distance / step));
    for (let index = 1; index <= segments; index += 1) {
      const ratio = index / segments;
      drawPoint(
        from.x + (to.x - from.x) * ratio,
        from.y + (to.y - from.y) * ratio,
        selectedTool,
        selectedBrushSize,
      );
    }
  };

  const onPointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!ready) return;
    updateBrushCursor(event);
    const canvas = event.currentTarget;
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    activeStrokeRef.current = {
      tool,
      brushSize,
      points: [point],
    };
    lastPointRef.current = point;
    drawPoint(point.x, point.y, tool, brushSize);
  };

  const onPointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    updateBrushCursor(event);
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    const lastPoint = lastPointRef.current;
    const activeStroke = activeStrokeRef.current;
    if (lastPoint && activeStroke) {
      drawLine(
        lastPoint,
        point,
        activeStroke.tool,
        activeStroke.brushSize,
      );
      activeStroke.points.push(point);
    }
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    const activeStroke = activeStrokeRef.current;
    if (activeStroke) {
      strokesRef.current.push(activeStroke);
      setCanUndo(true);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
    activeStrokeRef.current = null;
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const baseBitmap = baseBitmapRef.current;
    if (!canvas || !baseBitmap || strokesRef.current.length === 0) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    strokesRef.current.pop();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";
    context.drawImage(baseBitmap, 0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      const [firstPoint, ...remainingPoints] = stroke.points;
      if (!firstPoint) continue;
      drawPoint(
        firstPoint.x,
        firstPoint.y,
        stroke.tool,
        stroke.brushSize,
      );
      let previousPoint = firstPoint;
      for (const point of remainingPoints) {
        drawLine(
          previousPoint,
          point,
          stroke.tool,
          stroke.brushSize,
        );
        previousPoint = point;
      }
    }

    setCanUndo(strokesRef.current.length > 0);
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
            onPointerEnter={updateBrushCursor}
            onPointerLeave={hideBrushCursor}
          />
          <span
            ref={brushCursorRef}
            className={`mask-brush-cursor is-${tool}`}
            style={{ width: brushSize, height: brushSize }}
            aria-hidden="true"
          />
          {!ready && (
            <span>
              {prepareError
                ? "高清画布准备失败，请关闭后重试"
                : "正在准备高清画布…"}
            </span>
          )}
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
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="可连续撤销，直到恢复进入修边时的原始状态"
          >
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
