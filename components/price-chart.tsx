"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface Snapshot {
  recordedAt: string;
  marketPrice: number | null;
  normalMarket: number | null;
  holofoilMarket: number | null;
  reverseHoloMarket: number | null;
}

interface Props {
  snapshots: Snapshot[];
  cardName: string;
  cadRate: number;
}

function toCAD(usd: number | null | undefined, rate: number): number | undefined {
  if (usd == null) return undefined;
  return parseFloat((usd * rate).toFixed(2));
}

export function PriceChart({ snapshots, cardName, cadRate }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
        <p>No price history yet.</p>
        <p className="text-xs mt-1">Sync prices to start building history.</p>
      </div>
    );
  }

  // Convert all USD prices to CAD before charting
  const data = snapshots.map((s) => ({
    date: format(new Date(s.recordedAt), "MMM d"),
    Market: toCAD(s.marketPrice, cadRate),
    Normal: toCAD(s.normalMarket, cadRate),
    Holofoil: toCAD(s.holofoilMarket, cadRate),
    "Reverse Holo": toCAD(s.reverseHoloMarket, cadRate),
  }));

  const hasHolo = snapshots.some((s) => s.holofoilMarket != null);
  const hasNormal = snapshots.some((s) => s.normalMarket != null);
  const hasReverseHolo = snapshots.some((s) => s.reverseHoloMarket != null);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Price History — {cardName}{" "}
        <span className="font-normal text-gray-400">(CAD)</span>
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={50}
          />
          <Tooltip
            formatter={(value: number) => [`CA$${value.toFixed(2)}`, ""]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="Market"
            stroke="#3B4CCA"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          {hasHolo && (
            <Line
              type="monotone"
              dataKey="Holofoil"
              stroke="#E3350D"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              connectNulls
            />
          )}
          {hasNormal && (
            <Line
              type="monotone"
              dataKey="Normal"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              connectNulls
            />
          )}
          {hasReverseHolo && (
            <Line
              type="monotone"
              dataKey="Reverse Holo"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
