import { NextResponse } from "next/server";
import { getUsdToCadRate } from "@/lib/exchange-rate";

// GET /api/exchange-rate — returns current USD→CAD rate for client components
// Response is cached by Next.js for 1 hour
export const revalidate = 3600;

export async function GET() {
  const result = await getUsdToCadRate();
  return NextResponse.json(result);
}
