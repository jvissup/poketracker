import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/prices/history?cardId=xy1-1&days=90
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  const days = Number(searchParams.get("days") ?? "90");

  if (!cardId) {
    return NextResponse.json({ error: "cardId is required" }, { status: 400 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.priceSnapshot.findMany({
      where: {
        cardId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: "asc" },
      select: {
        recordedAt: true,
        marketPrice: true,
        normalMarket: true,
        holofoilMarket: true,
        reverseHoloMarket: true,
      },
    });

    return NextResponse.json({ data: snapshots });
  } catch (err) {
    console.error("[prices history]", err);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
