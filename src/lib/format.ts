const money = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const plain = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

/** 1,234.50 (no symbol; column headers carry the EUR unit). */
export const fmtMoney = (n: number) => money.format(Math.abs(n) < 0.005 ? 0 : n);
/** 1,234.5 or 12 */
export const fmtNum = (n: number) => plain.format(Math.abs(n) < 0.005 ? 0 : n);
/** EUR 12,346 for tiles and chart axes. */
export const fmtEurShort = (n: number) => "€" + whole.format(n);
export const fmtEur = (n: number) =>
  Math.abs(n) < 0.005 ? "€0.00" : (n < 0 ? "-€" : "€") + money.format(Math.abs(n));
export const fmtPct = (n: number) => whole.format(n * 100) + "%";
