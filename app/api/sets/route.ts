import { NextResponse } from "next/server";
import { getSets } from "@/lib/pokemon-tcg";

// GET /api/sets — returns all sets, newest first, cached for 1 hour
// Used by the card search modal's set filter dropdown
export const revalidate = 3600;

export async function GET() {
  try {
    const sets = await getSets();
    // Return only the fields the UI needs to keep the payload small
    const slim = sets.map((s) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      total: s.total,
      releaseDate: s.releaseDate ?? null,
      symbolUrl: s.images?.symbol ?? null,
    }));
    return NextResponse.json({ data: slim });
  } catch (err) {
    console.error("[sets]", err);
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }
}
