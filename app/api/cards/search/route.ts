import { NextRequest, NextResponse } from "next/server";
import { searchCards } from "@/lib/pokemon-tcg";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const setId = searchParams.get("setId") ?? undefined;
  const language = searchParams.get("language") ?? "en";
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  // Require at least a name query OR a set filter to avoid an unbounded search
  if (query.trim().length < 2 && !setId) {
    return NextResponse.json({ data: [] });
  }

  try {
    const cards = await searchCards(query.trim(), { pageSize, setId, language });
    return NextResponse.json({ data: cards });
  } catch (err) {
    console.error("[card search]", err);
    return NextResponse.json(
      { error: "Failed to search cards" },
      { status: 500 }
    );
  }
}
