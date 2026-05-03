"use client";

import React, { useState } from "react";
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

  // チャートの共通オプション
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
        onClick={() => setIsOpen(true)}
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
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
        シェア用画面を表示
      </button>

      {/* モーダルオーバーレイ */}
      {isOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "#0f1419",
              borderRadius: "20px",
              padding: "24px",
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()} // モーダル内クリックで閉じないように
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {/* Content: Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px", color: "#6366f1" }}>Chart Art</h2>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: 0 }}>DCA Simulation Result</p>
            </div>

            {/* Input Chart */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "0 0 6px" }}>あなたの描いた変動予測</p>
              <div style={{ height: "90px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", padding: "10px" }}>
                <Line
                  data={{
                    labels: variations.map((_, i) => i),
                    datasets: [{ data: variations, borderColor: "#6366f1", borderWidth: 2, tension: 0.4 }],
                  }}
                  options={commonOptions}
                />
              </div>
            </div>

            {/* Result Chart */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "0 0 6px" }}>積立損益率の推移</p>
              <div style={{ height: "90px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", padding: "10px" }}>
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

            {/* Summary */}
            <div style={{ 
              background: "rgba(99, 102, 241, 0.1)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(99, 102, 241, 0.2)"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>投資総額</div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{summary.totalInvestment.toLocaleString()}円</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>最終評価額</div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{summary.finalValue.toLocaleString()}円</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>最終損益</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: summary.profitLoss >= 0 ? "#10b981" : "#ef4444" }}>
                    {summary.profitLoss >= 0 ? "+" : ""}{summary.profitLoss.toLocaleString()}円
                  </div>
                </div>
                <div style={{ 
                  background: summary.profitLoss >= 0 ? "#10b981" : "#ef4444",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}>
                  {summary.profitLossRate.toFixed(2)}%
                </div>
              </div>
            </div>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
              スクショしてシェアしよう！
            </p>
          </div>
        </div>
      )}
    </>
  );
}
