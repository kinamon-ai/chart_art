"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Chart.js の必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type Props = {
  results: any[];
  summary: any;
  variations: number[];
};

export function ScreenshotShare({ results, summary, variations }: Props) {
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleCapture = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#0f1419",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "chart-art-result.png", { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "DCA シミュレーション結果",
              text: `最終損益: ${summary.profitLoss.toLocaleString()}円 (${summary.profitLossRate.toFixed(2)}%) #ChartArt #DCA`,
            });
          } catch (err) {
            if ((err as Error).name !== "AbortError") console.error("Share failed:", err);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `chart-art-result.png`;
          a.click();
          URL.revokeObjectURL(url);
          alert("ブラウザがシェアに未対応のため、画像を保存しました。");
        }
      }, "image/png");
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // チャートの共通オプション（シェアカード用）
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        grid: { color: "rgba(255,255,255,0.1)" },
        ticks: { color: "rgba(255,255,255,0.4)", font: { size: 9 } },
      },
    },
    elements: { point: { radius: 0 } },
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCapture}
        disabled={isCapturing}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.65rem 1.25rem",
          borderRadius: 8,
          border: "none",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          color: "#fff",
          fontWeight: 600,
          cursor: isCapturing ? "not-allowed" : "pointer",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
        {isCapturing ? "生成中..." : "写真をとってシェア"}
      </button>

      {/* キャプチャ用の隠しレイアウト */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          ref={captureRef}
          style={{
            width: "360px",
            padding: "20px",
            background: "#0f1419",
            color: "#ffffff",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "12px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#6366f1" }}>Chart Art</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>DCA Simulator</span>
          </div>

          {/* Input Chart Section */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "0 0 4px" }}>あなたの描いた変動率</p>
            <div style={{ height: "80px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px" }}>
              <Line
                data={{
                  labels: variations.map((_, i) => i),
                  datasets: [{ data: variations, borderColor: "#6366f1", borderWidth: 2, tension: 0.4 }],
                }}
                options={commonOptions}
              />
            </div>
          </div>

          {/* Result Chart Section */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "0 0 4px" }}>積立損益率の変化</p>
            <div style={{ height: "80px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px" }}>
              <Bar
                data={{
                  labels: results.map((_, i) => i),
                  datasets: [{
                    data: results.map(r => r.profitLossRate),
                    backgroundColor: results.map(r => r.profitLossRate >= 0 ? "#10b981" : "#ef4444"),
                  }],
                }}
                options={commonOptions}
              />
            </div>
          </div>

          {/* Summary Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "8px",
            background: "rgba(99, 102, 241, 0.1)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(99, 102, 241, 0.2)"
          }}>
            <div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>投資総額</div>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>{summary.totalInvestment.toLocaleString()}円</div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>最終評価額</div>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>{summary.finalValue.toLocaleString()}円</div>
            </div>
            <div style={{ gridColumn: "span 2", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>最終損益</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: summary.profitLoss >= 0 ? "#10b981" : "#ef4444" }}>
                  {summary.profitLoss >= 0 ? "+" : ""}{summary.profitLoss.toLocaleString()}円
                </div>
              </div>
              <div style={{ 
                background: summary.profitLoss >= 0 ? "#10b981" : "#ef4444",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                {summary.profitLossRate.toFixed(2)}%
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "12px", fontSize: "8px", color: "rgba(255,255,255,0.2)" }}>
            Chart Art - Hand-drawn DCA Simulator
          </div>
        </div>
      </div>
    </>
  );
}
