"use client";

import { useMemo, useState, useRef } from "react";
import {
  SIMULATOR_CONSTANTS,
  calculateDCAResults,
  summaryFromResults,
} from "@/lib/dca";
import { ResultChart } from "@/components/ResultChart";
import { ShareButtons } from "@/components/ShareButtons";
import { DrawVariationChart } from "@/components/DrawVariationChart";
import { ScreenshotShare } from "@/components/ScreenshotShare";
import {
  DEFAULTS,
  HORIZONTAL_AXIS_OPTIONS,
  VERTICAL_AXIS_OPTIONS,
} from "@/lib/simulatorOptions";

export function Simulator() {
  const [periods, setPeriods] = useState<number>(DEFAULTS.periods);
  const [verticalAxisLabel, setVerticalAxisLabel] = useState<string>(DEFAULTS.verticalAxisLabel);
  const [horizontalAxisLabel, setHorizontalAxisLabel] = useState<string>(
    DEFAULTS.horizontalAxisLabel
  );
  const [variations, setVariations] = useState<number[]>([]);
  const [hasStroke, setHasStroke] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof calculateDCAResults>>([]);
  const [chartResetSeed, setChartResetSeed] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const selectedVertical = useMemo(
    () =>
      VERTICAL_AXIS_OPTIONS.find((option) => option.label === verticalAxisLabel) ??
      VERTICAL_AXIS_OPTIONS[3],
    [verticalAxisLabel]
  );

  const runSimulation = () => {
    if (!hasStroke || variations.length !== periods) return;
    const next = calculateDCAResults(variations);
    setResults(next);
    setShowResults(true);

    // 少し待機してから結果までスクロール（DOMの描画を待つ）
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const resetForm = () => {
    setShowResults(false);
    setChartResetSeed((prev) => prev + 1);
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
          手書きチャートでドルコスト平均法の体験!!
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
          価格変動率（%）を手書きし、積立シミュレーションの結果を確認できます。
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0.75rem",
            marginBottom: "0.9rem",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.9rem" }}>
            <span style={{ color: "var(--muted)" }}>縦軸</span>
            <select
              value={verticalAxisLabel}
              onChange={(e) => {
                setVerticalAxisLabel(e.target.value);
                setShowResults(false);
                setChartResetSeed((prev) => prev + 1);
              }}
              style={{
                padding: "0.55rem 0.6rem",
                borderRadius: 8,
                border: "1px solid #2d3a47",
                background: "#0f1419",
                color: "var(--text)",
              }}
            >
              {VERTICAL_AXIS_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.9rem" }}>
            <span style={{ color: "var(--muted)" }}>横軸</span>
            <select
              value={horizontalAxisLabel}
              onChange={(e) => {
                setHorizontalAxisLabel(e.target.value);
                setShowResults(false);
                setChartResetSeed((prev) => prev + 1);
              }}
              style={{
                padding: "0.55rem 0.6rem",
                borderRadius: 8,
                border: "1px solid #2d3a47",
                background: "#0f1419",
                color: "var(--text)",
              }}
            >
              {HORIZONTAL_AXIS_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>積立回数</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                min={10}
                max={200}
                value={periods}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPeriods(val);
                  setShowResults(false);
                  setChartResetSeed((prev) => prev + 1);
                }}
                onBlur={(e) => {
                  // 範囲外の値を調整
                  const val = Math.min(200, Math.max(10, Number(e.target.value)));
                  setPeriods(val);
                }}
                style={{
                  width: "70px",
                  padding: "0.3rem 0.5rem",
                  borderRadius: 6,
                  border: "1px solid #2d3a47",
                  background: "#0f1419",
                  color: "var(--text)",
                  fontSize: "0.9rem",
                  textAlign: "right",
                }}
              />
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>回</span>
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={1}
            value={periods}
            onChange={(e) => {
              setPeriods(Number(e.target.value));
              setShowResults(false);
              setChartResetSeed((prev) => prev + 1);
            }}
            style={{ width: "100%", cursor: "pointer" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--muted)",
              fontSize: "0.75rem",
              marginTop: "0.25rem",
            }}
          >
            <span>10</span>
            <span>200</span>
          </div>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 0.65rem" }}>
          初期価格は {SIMULATOR_CONSTANTS.initialPrice} 円、積立額は毎回{" "}
          {SIMULATOR_CONSTANTS.investmentAmount.toLocaleString()} 円です。チャートを描いてから実行してください。
        </p>

        <DrawVariationChart
          key={`${verticalAxisLabel}-${horizontalAxisLabel}-${periods}-${chartResetSeed}`}
          periods={periods}
          maxAbsPercent={selectedVertical.maxAbsPercent}
          horizontalAxisLabel={horizontalAxisLabel}
          onVariationsChange={setVariations}
          onHasStrokeChange={setHasStroke}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={runSimulation}
            disabled={!hasStroke}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: 8,
              border: "none",
              background: hasStroke ? "var(--accent)" : "#5a6a7b",
              color: "#fff",
              fontWeight: 600,
              cursor: hasStroke ? "pointer" : "not-allowed",
            }}
          >
            シミュレーション実行
          </button>
          <button
            type="button"
            onClick={() => setChartResetSeed((prev) => prev + 1)}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: 8,
              border: "1px solid #2d3a47",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            チャートをクリア
          </button>
        </div>
      </section>

      {showResults && summary && (
        <>
          <section
            ref={resultsRef}
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
              円で設定しています。購入価格は手書きした変動率チャートを各積立回でサンプリングして計算し、購入数量を決定しています（独立変動モデル）。
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
              <ScreenshotShare results={results} summary={summary} variations={variations} />
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
