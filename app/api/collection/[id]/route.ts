import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/collection/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.collectionItem.findUnique({
      where: { id: params.id },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (err) {
    console.error("[collection GET id]", err);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// PATCH /api/collection/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { condition, quantity, purchasePrice, notes } = body;

    const item = await prisma.collectionItem.update({
      where: { id: params.id },
      data: {
        ...(condition !== undefined && { condition }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(purchasePrice !== undefined && {
          purchasePrice: purchasePrice != null ? Number(purchasePrice) : null,
        }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ data: item });
  } catch (err) {
    console.error("[collection PATCH]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/collection/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.collectionItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[collection DELETE]", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
