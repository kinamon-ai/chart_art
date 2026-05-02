export const VERTICAL_AXIS_OPTIONS = [
  { label: "±10%", maxAbsPercent: 10 },
  { label: "±30%", maxAbsPercent: 30 },
  { label: "±50%", maxAbsPercent: 50 },
  { label: "±100%", maxAbsPercent: 100 },
  { label: "±500%", maxAbsPercent: 500 },
  { label: "±1000%", maxAbsPercent: 1000 },
] as const;

export const HORIZONTAL_AXIS_OPTIONS = [
  { label: "30日", days: 30 },
  { label: "90日", days: 90 },
  { label: "半年", days: 182 },
  { label: "1年", days: 365 },
  { label: "3年", days: 365 * 3 },
  { label: "5年", days: 365 * 5 },
  { label: "10年", days: 365 * 10 },
  { label: "20年", days: 365 * 20 },
  { label: "30年", days: 365 * 30 },
  { label: "50年", days: 365 * 50 },
] as const;

export const PERIOD_OPTIONS = Array.from(
  { length: 20 },
  (_, index) => 10 + index * 10
);

export const DEFAULTS = {
  verticalAxisLabel: "±100%",
  horizontalAxisLabel: "5年",
  periods: 60,
} as const;
