export type DCARow = {
  price: number;
  shares: number;
  totalShares: number;
  investment: number;
  totalInvestment: number;
  value: number;
  profitLossRate: number;
};

const INITIAL_PRICE = 1000;
const INVESTMENT_AMOUNT = 10_000;
const MIN_ALLOWED_VARIATION = -99;

export function calculateDCAResults(priceVariationsPercent: number[]): DCARow[] {
  const results: DCARow[] = [];
  let totalShares = 0;
  let totalInvestment = 0;

  for (let i = 0; i < priceVariationsPercent.length; i++) {
    // Prevent zero/negative price when extreme negative variations are drawn.
    const safeVariation = Math.max(MIN_ALLOWED_VARIATION, priceVariationsPercent[i]);
    const currentPrice = INITIAL_PRICE * (1 + safeVariation / 100);
    const shares = INVESTMENT_AMOUNT / currentPrice;
    totalShares += shares;
    totalInvestment += INVESTMENT_AMOUNT;
    const currentValue = totalShares * currentPrice;
    const profitLossRate =
      (currentValue / totalInvestment - 1) * 100;

    results.push({
      price: currentPrice,
      shares,
      totalShares,
      investment: INVESTMENT_AMOUNT,
      totalInvestment,
      value: currentValue,
      profitLossRate,
    });
  }

  return results;
}

export function summaryFromResults(results: DCARow[]) {
  const last = results[results.length - 1];
  if (!last) {
    return null;
  }
  const avgPrice = last.totalInvestment / last.totalShares;
  const profitLoss = last.value - last.totalInvestment;
  return {
    totalInvestment: last.totalInvestment,
    finalValue: last.value,
    profitLoss,
    profitLossRate: last.profitLossRate,
    avgPrice,
  };
}

export const SIMULATOR_CONSTANTS = {
  initialPrice: INITIAL_PRICE,
  investmentAmount: INVESTMENT_AMOUNT,
} as const;
