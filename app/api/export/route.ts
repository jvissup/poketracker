import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/export — download collection as CSV
export async function GET() {
  try {
    const items = await prisma.collectionItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Card Name",
      "Set Name",
      "Card Number",
      "Rarity",
      "Condition",
      "Quantity",
      "Purchase Price",
      "Notes",
      "Card ID",
      "Added At",
    ];

    const rows = items.map((item) => [
      `"${item.cardName.replace(/"/g, '""')}"`,
      `"${item.setName.replace(/"/g, '""')}"`,
      item.cardNumber,
      item.rarity ?? "",
      item.condition,
      item.quantity,
      item.purchasePrice ?? "",
      `"${(item.notes ?? "").replace(/"/g, '""')}"`,
      item.cardId,
      item.createdAt.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="pokemon-collection-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("[export]", err);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
