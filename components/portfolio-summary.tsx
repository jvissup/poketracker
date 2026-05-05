"use client";

import { TrendingUp, TrendingDown, Minus, Package, DollarSign, BarChart2 } from "lucide-react";
import { formatCAD, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  totalCards: number;
  uniqueCards: number;
  totalMarketValueUsd: number | null;
  totalCostBasisUsd: number | null;
  cadRate: number;
}

export function PortfolioSummary({
  totalCards,
  uniqueCards,
  totalMarketValueUsd,
  totalCostBasisUsd,
  cadRate,
}: Props) {
  const totalMarketValue =
    totalMarketValueUsd != null ? totalMarketValueUsd * cadRate : null;
  const totalCostBasis =
    totalCostBasisUsd != null ? totalCostBasisUsd * cadRate : null;

  const gainAmount =
    totalMarketValue != null && totalCostBasis != null
      ? totalMarketValue - totalCostBasis
      : null;
  const gainPercent =
    gainAmount != null && totalCostBasis != null && totalCostBasis > 0
      ? (gainAmount / totalCostBasis) * 100
      : null;

  const GainIcon =
    gainAmount == null ? Minus : gainAmount >= 0 ? TrendingUp : TrendingDown;
  const gainColor =
    gainAmount == null
      ? "text-gray-400"
      : gainAmount >= 0
      ? "text-green-600"
      : "text-red-500";

  const stats = [
    {
      label: "Total Cards",
      value: totalCards.toLocaleString(),
      sub: `${uniqueCards} unique`,
      icon: Package,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Market Value (CAD)",
      value: totalMarketValue != null ? formatCAD(totalMarketValueUsd, cadRate) : "—",
      sub: totalMarketValue == null ? "Sync prices to calculate" : "Based on latest sync",
      icon: DollarSign,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Cost Basis (CAD)",
      value: totalCostBasis != null ? formatCAD(totalCostBasisUsd, cadRate) : "—",
      sub: totalCostBasis == null ? "Add purchase prices to track" : "What you paid",
      icon: BarChart2,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Gain / Loss",
      value:
        gainAmount != null
          ? `${gainAmount >= 0 ? "+" : ""}${formatCAD(Math.abs(gainAmount) / cadRate, cadRate).replace("$", gainAmount >= 0 ? "+$" : "-$")}`
          : "—",
      sub:
        gainPercent != null
          ? formatPercent(gainPercent)
          : "Add prices to track",
      icon: GainIcon,
      iconBg:
        gainAmount == null
          ? "bg-gray-100"
          : gainAmount >= 0
          ? "bg-green-100"
          : "bg-red-100",
      iconColor: gainColor,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3"
        >
          <div className={cn("p-2 rounded-lg shrink-0", stat.iconBg)}>
            <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p
              className={cn(
                "text-xl font-bold mt-0.5",
                stat.label === "Gain / Loss" ? gainColor : "text-gray-900"
              )}
            >
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
