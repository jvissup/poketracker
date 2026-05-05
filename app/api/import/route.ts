import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCard } from "@/lib/pokemon-tcg";

interface ImportRow {
  cardId?: string;
  "Card ID"?: string;
  "Card Name"?: string;
  cardName?: string;
  "Set Name"?: string;
  setName?: string;
  "Card Number"?: string;
  cardNumber?: string;
  "Condition"?: string;
  condition?: string;
  "Quantity"?: string;
  quantity?: string;
  "Purchase Price"?: string;
  purchasePrice?: string;
  "Notes"?: string;
  notes?: string;
}

// POST /api/import — accepts JSON array of rows (parsed CSV on client)
// Each row must have either `cardId` (preferred) or enough info to identify the card
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: ImportRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const results = { imported: 0, failed: 0, errors: [] as string[] };

    for (const row of rows) {
      const cardId =
        row.cardId || row["Card ID"] || "";
      const cardName = row.cardName || row["Card Name"] || "";
      const setName = row.setName || row["Set Name"] || "";
      const cardNumber = row.cardNumber || row["Card Number"] || "";
      const condition = row.condition || row["Condition"] || "NM";
      const quantity = Number(row.quantity || row["Quantity"] || 1);
      const purchasePrice =
        row.purchasePrice || row["Purchase Price"]
          ? Number(row.purchasePrice || row["Purchase Price"])
          : null;
      const notes = row.notes || row["Notes"] || null;

      if (!cardId && !cardName) {
        results.failed++;
        results.errors.push(`Row missing cardId and cardName`);
        continue;
      }

      try {
        // If we have a cardId, look it up for full metadata
        if (cardId) {
          const card = await getCard(cardId);
          if (card) {
            await prisma.collectionItem.create({
              data: {
                cardId: card.id,
                cardName: card.name,
                setId: card.set.id,
                setName: card.set.name,
                cardNumber: card.number,
                rarity: card.rarity ?? null,
                imageSmall: card.images.small,
                imageLarge: card.images.large,
                supertype: card.supertype ?? null,
                subtypes: card.subtypes ?? [],
                condition,
                quantity,
                purchasePrice,
                notes,
              },
            });
            results.imported++;
            continue;
          }
        }

        // Fallback: use raw CSV data without API lookup
        if (cardName) {
          await prisma.collectionItem.create({
            data: {
              cardId: cardId || `manual-${Date.now()}`,
              cardName,
              setId: "unknown",
              setName,
              cardNumber,
              condition,
              quantity,
              purchasePrice,
              notes,
            },
          });
          results.imported++;
        }
      } catch (rowErr) {
        results.failed++;
        results.errors.push(`Failed to import "${cardName || cardId}"`);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("[import]", err);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
