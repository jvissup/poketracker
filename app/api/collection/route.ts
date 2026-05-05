import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/collection — list all items
export async function GET() {
  try {
    const items = await prisma.collectionItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[collection GET]", err);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

// POST /api/collection — add a card to the collection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cardId,
      cardName,
      setId,
      setName,
      cardNumber,
      rarity,
      imageSmall,
      imageLarge,
      supertype,
      subtypes,
      condition,
      quantity,
      purchasePrice,
      notes,
    } = body;

    if (!cardId || !cardName || !setId || !setName || !cardNumber) {
      return NextResponse.json(
        { error: "Missing required fields: cardId, cardName, setId, setName, cardNumber" },
        { status: 400 }
      );
    }

    const item = await prisma.collectionItem.create({
      data: {
        cardId,
        cardName,
        setId,
        setName,
        cardNumber,
        rarity: rarity ?? null,
        imageSmall: imageSmall ?? null,
        imageLarge: imageLarge ?? null,
        supertype: supertype ?? null,
        subtypes: subtypes ?? [],
        condition: condition ?? "NM",
        quantity: quantity ?? 1,
        purchasePrice: purchasePrice != null ? Number(purchasePrice) : null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error("[collection POST]", err);
    return NextResponse.json({ error: "Failed to add card" }, { status: 500 });
  }
}
