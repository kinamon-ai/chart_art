"use client";

import { useCallback, useMemo, useState } from "react";
import {
  SIMULATOR_CONSTANTS,
  calculateDCAResults,
  summaryFromResults,
} from "@/lib/dca";
import { ResultChart } from "@/components/ResultChart";
import { ShareButtons } from "@/components/ShareButtons";

const DEFAULT_VARIATIONS = [
  2, -1.5, 3, -2, 1, 0.5, -3, 4, -1, 2.5, -0.5, 1.5,
];

function randomVariations(n: number): number[] {
  return Array.from({ length: n }, () => (Math.random() * 8 - 4));
}

export function Simulator() {
  const [periods, setPeriods] = useState(12);
  const [variations, setVariations] = useState<number[]>(DEFAULT_VARIATIONS);
  const [showResults, setShowResults] = useState(true);
  const [results, setResults] = useState(
    () => calculateDCAResults(DEFAULT_VARIATIONS)
  );

  const syncVariationsToPeriods = useCallback(
    (nextPeriods: number) => {
      setVariations((prev) => {
        if (nextPeriods === prev.length) return prev;
        if (nextPeriods > prev.length) {
          const extra = Array.from(
            { length: nextPeriods - prev.length },
            (_, i) => randomVariations(1)[0] ?? 0
          );
          return [...prev, ...extra];
        }
        return prev.slice(0, nextPeriods);
      });
    },
    []
  );

  const onPeriodsChange = (n: number) => {
    const clamped = Math.min(60, Math.max(1, n));
    setPeriods(clamped);
    syncVariationsToPeriods(clamped);
  };

  const setVariationAt = (index: number, value: number) => {
    setVariations((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const runSimulation = () => {
    const next = calculateDCAResults(variations);
    setResults(next);
    setShowResults(true);
  };

  const resetForm = () => {
    setShowResults(false);
  };

  const summary = useMemo(() => summaryFromResults(results), [results]);

  const profitLossYenText = summary
    ? `${summary.profitLoss >= 0 ? "" : "−"}${Math.abs(
        Math.round(summary.profitLoss)
      ).toLocaleString()}円`
    : "0円";

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          ドルコスト平均法シミュレータ
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
          各期の価格変動率（%）を入力し、積立シミュレーションの結果を確認できます。
        </p>
      </header>

      <section
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          <span style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.9rem" }}>
            積立回数（期間数）
          </span>
          <input
            type="number"
            min={1}
            max={60}
            value={periods}
            onChange={(e) => onPeriodsChange(Number(e.target.value))}
            style={{
              width: 120,
              padding: "0.5rem 0.65rem",
              borderRadius: 8,
              border: "1px solid #2d3a47",
              background: "#0f1419",
              color: "var(--text)",
            }}
          />
        </label>

        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 0.75rem" }}>
          各回の価格変動率（%）。初期価格は {SIMULATOR_CONSTANTS.initialPrice}{" "}
          円、積立額は毎回 {SIMULATOR_CONSTANTS.investmentAmount.toLocaleString()} 円です。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.5rem",
            marginBottom: "1rem",
            maxHeight: 220,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {variations.map((v, i) => (
            <label
              key={i}
              style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ color: "var(--muted)" }}>{i + 1} 回目 (%)</span>
              <input
                type="number"
                step="0.1"
                value={v}
                onChange={(e) => setVariationAt(i, Number(e.target.value))}
                style={{
                  padding: "0.4rem 0.5rem",
                  borderRadius: 8,
                  border: "1px solid #2d3a47",
                  background: "#0f1419",
                  color: "var(--text)",
                }}
              />
            </label>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={runSimulation}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            シミュレーション実行
          </button>
          <button
            type="button"
            onClick={() => setVariations(randomVariations(periods))}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: 8,
              border: "1px solid #2d3a47",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            変動率をランダム生成
          </button>
        </div>
      </section>

      {showResults && summary && (
        <>
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", margin: "0 0 0.75rem" }}>
              シミュレーション結果
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--muted)",
                margin: "0 0 1rem",
                lineHeight: 1.6,
              }}
            >
              積立金額は {SIMULATOR_CONSTANTS.investmentAmount.toLocaleString()}
              円で設定しています。購入価格は各期の変動率に基づいて計算し、購入数量を決定しています（ドルコスト平均法に準ずる）。
            </p>

            <ResultChart results={results} />

            <div
              style={{
                marginTop: "1.25rem",
                display: "grid",
                gap: "0.65rem",
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted)" }}>投資総額</span>
                <span>{summary.totalInvestment.toLocaleString()} 円</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted)" }}>最終評価額</span>
                <span>{summary.finalValue.toLocaleString()} 円</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted)" }}>平均取得単価</span>
                <span>{summary.avgPrice.toFixed(2)} 円</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted)" }}>最終損益</span>
                <span
                  style={{
                    color: summary.profitLoss >= 0 ? "var(--positive)" : "var(--negative)",
                  }}
                >
                  {summary.profitLoss.toLocaleString()} 円（
                  {summary.profitLossRate.toFixed(2)}%）
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted)" }}>最終損益額</span>
                <span
                  style={{
                    color: summary.profitLoss >= 0 ? "var(--positive)" : "var(--negative)",
                  }}
                >
                  {summary.profitLoss.toLocaleString()} 円
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid #2d3a47",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "0.55rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #2d3a47",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                もう一回
              </button>
              <div>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                  共有
                </p>
                <ShareButtons profitLossYenText={profitLossYenText} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
