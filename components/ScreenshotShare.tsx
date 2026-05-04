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
import { SIMULATOR_CONSTANTS } from "@/lib/dca";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 画像として保存（またはシェア）
  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setIsProcessing(true);
    setPreviewUrl(null);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0f1419",
        scale: 2,
        useCORS: true,
      });

      // iOSとの相性を考慮して image/jpeg を使用
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url); // 長押し保存用にプレビューを表示

        const file = new File([blob], "chart-art-result.jpg", { type: "image/jpeg" });

        // Share API 試行
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Chart Art Result",
            });
          } catch (err) {
            // ユーザーによるキャンセル以外はエラー表示
            if ((err as Error).name !== "AbortError") console.error(err);
          }
        } else {
          // PC等のフォールバック
          const a = document.createElement("a");
          a.href = url;
          a.download = "chart-art-result.jpg";
          a.click();
        }
      }, "image/jpeg", 0.9);
    } catch (err) {
      console.error(err);
      alert("画像の生成に失敗しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = async () => {
    const text = `ドルコスト平均法シミュレーション結果\n投資額: 1回${SIMULATOR_CONSTANTS.investmentAmount.toLocaleString()}円 × ${results.length}回 = 合計${summary.totalInvestment.toLocaleString()}円\n最終損益: ${summary.profitLoss.toLocaleString()}円 (${summary.profitLossRate.toFixed(2)}%)\n#ChartArt #DCA\n${window.location.href}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("結果をコピーしました！");
    } catch (err) {
      alert("コピーに失敗しました。");
    }
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        beginAtZero: true,
        grid: {
          color: (context: any) => context.tick.value === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)",
          lineWidth: (context: any) => context.tick.value === 0 ? 2 : 1,
        },
        ticks: { color: "rgba(255,255,255,0.4)", font: { size: 9 } },
      },
    },
    elements: { point: { radius: 0 } },
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setIsOpen(true); setPreviewUrl(null); }}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem",
          borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          color: "#fff", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
        シェア用画面を表示
      </button>

      {isOpen && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", overflowY: "auto",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            ref={cardRef}
            style={{
              width: "100%", maxWidth: "360px", background: "#0f1419", borderRadius: "20px",
              padding: "24px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px", color: "#6366f1" }}>Chart Art</h2>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: 0 }}>ドルコストシミュレーター結果</p>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>予測変動</p>
              <div style={{ height: "70px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "6px" }}>
                <Line
                  data={{
                    labels: variations.map((_, i) => i),
                    datasets: [{ data: variations, borderColor: "#6366f1", borderWidth: 2, tension: 0.4 }],
                  }}
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        ...commonOptions.scales.y,
                        // 0を中心とした対称なスケールにする
                        min: -Math.max(...variations.map(Math.abs), 10),
                        max: Math.max(...variations.map(Math.abs), 10),
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>損益推移</p>
              <div style={{ height: "70px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "6px" }}>
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

            <div style={{ marginBottom: "16px", padding: "0 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255,255,255,0.7)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px" }}>1回あたりの投資</span>
                  <span style={{ fontWeight: "600", fontSize: "13px" }}>{SIMULATOR_CONSTANTS.investmentAmount.toLocaleString()}円</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px" }}>積立回数</span>
                  <span style={{ fontWeight: "600", fontSize: "13px" }}>{results.length}回</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px" }}>投資総額</span>
                  <span style={{ fontWeight: "600", fontSize: "13px" }}>{summary.totalInvestment.toLocaleString()}円</span>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(99, 102, 241, 0.1)", padding: "14px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: summary.profitLoss >= 0 ? "#10b981" : "#ef4444" }}>
                  {summary.profitLoss >= 0 ? "+" : ""}{summary.profitLoss.toLocaleString()}円
                </div>
                <div style={{ 
                  background: summary.profitLoss >= 0 ? "#10b981" : "#ef4444",
                  color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold"
                }}>
                  {summary.profitLossRate.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* 生成された画像のプレビュー（長押し用） */}
          {previewUrl && (
            <div style={{ marginBottom: "20px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <p style={{ color: "#fff", fontSize: "12px", marginBottom: "8px" }}>画像を長押しして「"写真"に保存」も可能です</p>
              <img src={previewUrl} alt="Preview" style={{ width: "100%", maxWidth: "300px", borderRadius: "10px", boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }} />
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleSaveImage} disabled={isProcessing}
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#fff", color: "#0f1419", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
            >
              {isProcessing ? "生成中..." : "保存・シェア"}
            </button>
            <button
              onClick={handleCopyText}
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
            >
              結果をコピー
            </button>
          </div>

          <button onClick={() => setIsOpen(false)} style={{ marginTop: "24px", color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}>
            閉じる
          </button>
        </div>
      )}
    </>
  );
}
