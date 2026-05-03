// 描画領域の余白設定を定数として定義（リファクタリング対応）
const CHART_MARGINS = {
  marginTop: 12,
  marginRight: 8,
  marginBottom: 24,
  marginLeft: 44,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nearestYByX(points: Point[], x: number) {
  let best = points[0];
  let bestDistance = Math.abs(points[0].x - x);
  for (let i = 1; i < points.length; i++) {
    const distance = Math.abs(points[i].x - x);
    if (distance < bestDistance) {
      best = points[i];
      bestDistance = distance;
    }
  }
  return best.y;
}

function sampleVariations(points: Point[], periods: number, maxAbsPercent: number) {
  if (points.length === 0) return [];
  return Array.from({ length: periods }, (_, i) => {
    const x = (i + 0.5) / periods;
    const y = nearestYByX(points, x);
    const variation = (1 - y * 2) * maxAbsPercent;
    return Number(clamp(variation, -maxAbsPercent, maxAbsPercent).toFixed(2));
  });
}

export function DrawVariationChart({
  periods,
  maxAbsPercent,
  horizontalAxisLabel,
  onVariationsChange,
  onHasStrokeChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [points, setPoints] = useState<Point[]>([]);

  const sampledVariations = useMemo(
    () => sampleVariations(points, periods, maxAbsPercent),
    [points, periods, maxAbsPercent]
  );

  useEffect(() => {
    onHasStrokeChange(points.length > 0);
    onVariationsChange(sampledVariations);
  }, [points.length, sampledVariations, onHasStrokeChange, onVariationsChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // --- 描画領域の計算 (定数を使用) ---
    const plotWidth = width - CHART_MARGINS.marginLeft - CHART_MARGINS.marginRight;
    const plotHeight = height - CHART_MARGINS.marginTop - CHART_MARGINS.marginBottom;

    const toX = (x: number) => CHART_MARGINS.marginLeft + x * plotWidth;
    const toY = (y: number) => CHART_MARGINS.marginTop + y * plotHeight;
    // ------------------------------------

    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = CHART_MARGINS.marginTop + (plotHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(CHART_MARGINS.marginLeft, y);
      ctx.lineTo(width - CHART_MARGINS.marginRight, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 6; i++) {
      const x = CHART_MARGINS.marginLeft + (plotWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, CHART_MARGINS.marginTop);
      ctx.lineTo(x, height - CHART_MARGINS.marginBottom);
      ctx.stroke();
    }

    ctx.fillStyle = "#8b9aab";
    ctx.font = "11px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`+${maxAbsPercent}%`, 6, CHART_MARGINS.marginTop + 4);
    ctx.fillText("0%", 6, CHART_MARGINS.marginTop + plotHeight / 2 + 4);
    ctx.fillText(`-${maxAbsPercent}%`, 6, height - CHART_MARGINS.marginBottom - 2);

    ctx.textAlign = "right";
    ctx.fillText(horizontalAxisLabel, width - CHART_MARGINS.marginRight, height - 4);

    if (points.length > 0) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(toX(points[0].x), toY(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toX(points[i].x), toY(points[i].y));
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = "#8b9aab";
      ctx.textAlign = "center";
      ctx.fillText("ここを指でなぞって、変動率の形を描いてください", width / 2, height / 2);
    }
  }, [points, maxAbsPercent, horizontalAxisLabel]);

  // --- 修正箇所: pointFromEvent のロジックをプロットエリア相対座標に変換 ---
  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    // 1. キャンバス上の物理座標を取得
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // 2. プロットエリア（余白の内側）に対する 0.0 〜 1.0 の比率を計算
    const plotWidth = rect.width - CHART_MARGINS.marginLeft - CHART_MARGINS.marginRight;
    const plotHeight = rect.height - CHART_MARGINS.marginTop - CHART_MARGINS.marginBottom;

    // x, y はプロットエリア内での相対座標 (0 to 1)
    const x = clamp((canvasX - CHART_MARGINS.marginLeft) / plotWidth, 0, 1);
    const y = clamp((canvasY - CHART_MARGINS.marginTop) / plotHeight, 0, 1);

    return { x, y };
  };
  // --------------------------------------------------------------------

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const point = pointFromEvent(event);
    if (!point) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPoints([point]);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    if (!point) return;
    setPoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.x - point.x) < 0.001 && Math.abs(last.y - point.y) < 0.001) {
        return prev;
      }
      return [...prev, point];
    });
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        style={{
          width: "100%",
          height: 280,
          borderRadius: 10,
          border: "1px solid #2d3a47",
          background: "#0f1419",
          display: "block",
          touchAction: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}