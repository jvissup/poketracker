import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a value as CAD currency (CA$1.23) */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol", // shows "$" not "CA$"
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Convert a USD value to CAD using the given rate, then format it */
export function formatCAD(
  usdValue: number | null | undefined,
  cadRate: number
): string {
  if (usdValue == null) return "—";
  return formatCurrency(usdValue * cadRate);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** Calculate gain/loss between purchase price and current market price */
export function calcGainLoss(
  purchasePrice: number | null | undefined,
  marketPrice: number | null | undefined,
  quantity: number = 1
): { amount: number | null; percent: number | null } {
  if (purchasePrice == null || marketPrice == null) {
    return { amount: null, percent: null };
  }
  const amount = (marketPrice - purchasePrice) * quantity;
  const percent = ((marketPrice - purchasePrice) / purchasePrice) * 100;
  return { amount, percent };
}

export const CONDITIONS = [
  { value: "PSA10", label: "PSA 10" },
  { value: "PSA9", label: "PSA 9" },
  { value: "PSA8", label: "PSA 8" },
  { value: "PSA7", label: "PSA 7" },
  { value: "MINT", label: "Mint" },
  { value: "NM", label: "Near Mint (NM)" },
  { value: "LP", label: "Lightly Played (LP)" },
  { value: "MP", label: "Moderately Played (MP)" },
  { value: "HP", label: "Heavily Played (HP)" },
  { value: "DMG", label: "Damaged" },
];
