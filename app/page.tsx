import { prisma } from "@/lib/db";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { formatCAD } from "@/lib/utils";
import { getUsdToCadRate } from "@/lib/exchange-rate";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SyncButton } from "@/components/sync-button";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [items, latestSnapshots, exchangeRate] = await Promise.all([
    prisma.collectionItem.findMany({
      select: {
        id: true,
        cardId: true,
        cardName: true,
        setName: true,
        imageSmall: true,
        quantity: true,
        purchasePrice: true,
      },
    }),
    // Get the most recent snapshot per card
    prisma.priceSnapshot.findMany({
      orderBy: { recordedAt: "desc" },
      distinct: ["cardId"],
      select: { cardId: true, marketPrice: true, recordedAt: true },
    }),
    getUsdToCadRate(),
  ]);

  const priceMap = new Map(latestSnapshots.map((s) => [s.cardId, s.marketPrice]));

  // Prices stored in DB are USD — accumulate in USD, display in CAD
  let totalMarketValueUsd: number | null = null;
  let totalCostBasisUsd: number | null = null;

  for (const item of items) {
    const marketPrice = priceMap.get(item.cardId);
    if (marketPrice != null) {
      totalMarketValueUsd = (totalMarketValueUsd ?? 0) + marketPrice * item.quantity;
    }
    if (item.purchasePrice != null) {
      totalCostBasisUsd = (totalCostBasisUsd ?? 0) + item.purchasePrice * item.quantity;
    }
  }

  // Top 5 most valuable cards by current market price
  const topCards = items
    .map((item) => ({
      ...item,
      marketPriceUsd: priceMap.get(item.cardId) ?? null,
      totalValueUsd:
        priceMap.get(item.cardId) != null
          ? (priceMap.get(item.cardId) as number) * item.quantity
          : null,
    }))
    .filter((c) => c.totalValueUsd != null)
    .sort((a, b) => (b.totalValueUsd ?? 0) - (a.totalValueUsd ?? 0))
    .slice(0, 5);

  return {
    totalCards: items.reduce((sum, i) => sum + i.quantity, 0),
    uniqueCards: items.length,
    totalMarketValueUsd,
    totalCostBasisUsd,
    topCards,
    lastSync: latestSnapshots[0]?.recordedAt ?? null,
    exchangeRate,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const rate = data.exchangeRate.rate;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.lastSync
              ? `Last synced: ${new Date(data.lastSync).toLocaleString()}`
              : "Prices not yet synced"}
            {" · "}
            <span className="text-gray-400">
              1 USD = ${rate.toFixed(4)} CAD
              {data.exchangeRate.source === "fallback" && " (est.)"}
            </span>
          </p>
        </div>
        <SyncButton />
      </div>

      <PortfolioSummary
        totalCards={data.totalCards}
        uniqueCards={data.uniqueCards}
        totalMarketValueUsd={data.totalMarketValueUsd}
        totalCostBasisUsd={data.totalCostBasisUsd}
        cadRate={rate}
      />

      {/* Top cards table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Most Valuable Cards</h2>
          <Link
            href="/collection"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.topCards.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            <p>No price data yet.</p>
            <p className="mt-1">Add cards to your collection and sync prices.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.topCards.map((card, i) => (
              <div key={card.id} className="flex items-center px-6 py-3 gap-4">
                <span className="w-5 text-sm font-medium text-gray-400 shrink-0">
                  {i + 1}
                </span>
                {card.imageSmall ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageSmall}
                    alt={card.cardName}
                    className="w-10 h-14 object-contain rounded shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-100 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {card.cardName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{card.setName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    {formatCAD(card.totalValueUsd, rate)}
                  </p>
                  {card.quantity > 1 && (
                    <p className="text-xs text-gray-400">
                      {card.quantity}× @ {formatCAD(card.marketPriceUsd, rate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
