import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCardsByIds, getBestMarketPrice } from "@/lib/pokemon-tcg";

// POST /api/prices/sync
// Fetches latest prices from Pokemon TCG API for all cards in the collection
// and stores a snapshot in PriceSnapshot table.
export async function POST() {
  try {
    const items = await prisma.collectionItem.findMany({
      select: { cardId: true, cardName: true, setId: true, setName: true },
    });

    if (items.length === 0) {
      return NextResponse.json({ message: "No cards in collection", synced: 0 });
    }

    // Deduplicate card IDs
    const uniqueIds = [...new Set(items.map((i) => i.cardId))];

    // Fetch in batches of 100 (API limit)
    const batchSize = 100;
    const allCards = [];
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const cards = await getCardsByIds(batch);
      allCards.push(...cards);
    }

    // Build a map for quick lookup
    const cardMap = new Map(allCards.map((c) => [c.id, c]));

    // Create price snapshots
    const snapshots = uniqueIds
      .map((cardId) => {
        const card = cardMap.get(cardId);
        if (!card) return null;

        const prices = card.tcgplayer?.prices;
        const item = items.find((i) => i.cardId === cardId)!;

        return {
          cardId,
          cardName: item.cardName,
          setId: item.setId,
          setName: item.setName,
          normalLow: prices?.normal?.low ?? null,
          normalMid: prices?.normal?.mid ?? null,
          normalHigh: prices?.normal?.high ?? null,
          normalMarket: prices?.normal?.market ?? null,
          holofoilLow: prices?.holofoil?.low ?? null,
          holofoilMid: prices?.holofoil?.mid ?? null,
          holofoilHigh: prices?.holofoil?.high ?? null,
          holofoilMarket: prices?.holofoil?.market ?? null,
          reverseHoloLow: prices?.reverseHolofoil?.low ?? null,
          reverseHoloMid: prices?.reverseHolofoil?.mid ?? null,
          reverseHoloHigh: prices?.reverseHolofoil?.high ?? null,
          reverseHoloMarket: prices?.reverseHolofoil?.market ?? null,
          marketPrice: getBestMarketPrice(card.tcgplayer),
        };
      })
      .filter((s): s is SnapshotInput => s !== null);

    await prisma.priceSnapshot.createMany({ data: snapshots });

    return NextResponse.json({
      message: "Prices synced successfully",
      synced: snapshots.length,
    });
  } catch (err) {
    console.error("[prices sync]", err);
    return NextResponse.json({ error: "Failed to sync prices" }, { status: 500 });
  }
}
