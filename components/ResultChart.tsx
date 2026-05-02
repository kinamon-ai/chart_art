"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { DCARow } from "@/lib/dca";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  results: DCARow[];
};

export function ResultChart({ results }: Props) {
  const labels = results.map((_, i) => String(i + 1));
  const profitLossData = results.map((r) => r.profitLossRate);
  const backgroundColors = profitLossData.map((v) =>
    v >= 0 ? "rgba(39, 174, 96, 0.7)" : "rgba(231, 76, 60, 0.7)"
  );
  const borderColors = profitLossData.map((v) =>
    v >= 0 ? "rgba(39, 174, 96, 1)" : "rgba(231, 76, 60, 1)"
  );

  return (
    <div style={{ height: 320, position: "relative" }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "損益率 (%)",
              data: profitLossData,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: "rgba(200, 200, 200, 0.2)" },
              ticks: {
                callback: (value) => `${value}%`,
              },
            },
            x: {
              grid: { display: false },
              ticks: { maxTicksLimit: 10 },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const index = ctx.dataIndex;
                  const result = results[index];
                  if (!result) return "";
                  return [
                    `損益率: ${result.profitLossRate.toFixed(2)}%`,
                    `積立回数: ${index + 1}回目`,
                    `価格: ${result.price.toFixed(2)}円`,
                    `評価額: ${result.value.toFixed(0)}円`,
                    `投資総額: ${result.totalInvestment.toFixed(0)}円`,
                  ];
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
