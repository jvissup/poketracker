// Pokemon TCG API wrapper
// Docs: https://docs.pokemontcg.io

const BASE_URL = "https://api.pokemontcg.io/v2";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }
  return headers;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TCGPrices {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  directLow?: number;
}

export interface TCGPlayerData {
  url?: string;
  updatedAt?: string;
  prices?: {
    normal?: TCGPrices;
    holofoil?: TCGPrices;
    reverseHolofoil?: TCGPrices;
    "1stEditionHolofoil"?: TCGPrices;
    "1stEditionNormal"?: TCGPrices;
  };
}

export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  rarity?: string;
  number: string;
  set: {
    id: string;
    name: string;
    series: string;
    total: number;
    releaseDate?: string;
    images?: {
      symbol?: string;
      logo?: string;
    };
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: TCGPlayerData;
}

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate?: string;
  images?: {
    symbol?: string;
    logo?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the single best market price from a card's tcgplayer data */
export function getBestMarketPrice(tcgplayer?: TCGPlayerData): number | null {
  if (!tcgplayer?.prices) return null;
  const { holofoil, normal, reverseHolofoil } = tcgplayer.prices;
  return (
    holofoil?.market ??
    normal?.market ??
    reverseHolofoil?.market ??
    null
  );
}

// ─── API Calls ────────────────────────────────────────────────────────────────

// Supported print languages in the Pokemon TCG API
export const CARD_LANGUAGES = [
  { value: "en", label: "English", apiValue: "English" },
  { value: "ja", label: "Japanese", apiValue: "Japanese" },
  { value: "fr", label: "French", apiValue: "French" },
  { value: "de", label: "German", apiValue: "German" },
  { value: "it", label: "Italian", apiValue: "Italian" },
  { value: "es", label: "Spanish", apiValue: "Spanish" },
  { value: "pt", label: "Portuguese", apiValue: "Portuguese" },
  { value: "ko", label: "Korean", apiValue: "Korean" },
  { value: "zh-Hant", label: "Chinese (Traditional)", apiValue: "Traditional Chinese" },
  { value: "zh-Hans", label: "Chinese (Simplified)", apiValue: "Simplified Chinese" },
  { value: "id", label: "Indonesian", apiValue: "Indonesian" },
  { value: "th", label: "Thai", apiValue: "Thai" },
] as const;

export type CardLanguageCode = (typeof CARD_LANGUAGES)[number]["value"];

/**
 * Search for cards by name, optionally filtered by set and/or language.
 */
export async function searchCards(
  query: string,
  options: { pageSize?: number; setId?: string; language?: string } = {}
): Promise<PokemonCard[]> {
  const { pageSize = 20, setId, language } = options;

  // Build query — name search always present, set and language optional
  const parts: string[] = [];
  if (query.trim()) parts.push(`name:"${query.trim()}*"`);
  if (setId) parts.push(`set.id:${setId}`);
  if (language && language !== "en") {
    // Find the full API language name from our lookup table
    const lang = CARD_LANGUAGES.find((l) => l.value === language);
    if (lang) parts.push(`language:"${lang.apiValue}"`);
  }

  // If no name query but we have set/language filters, search all cards in that scope
  const q = parts.length > 0 ? parts.join(" ") : "name:*";

  const params = new URLSearchParams({
    q,
    pageSize: String(pageSize),
    orderBy: "name",
  });

  const res = await fetch(`${BASE_URL}/cards?${params}`, {
    headers: getHeaders(),
    next: { revalidate: 300 }, // cache 5 minutes
  });

  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  const data = await res.json();
  return data.data as PokemonCard[];
}

/**
 * Get a single card by its ID
 */
export async function getCard(cardId: string): Promise<PokemonCard | null> {
  const res = await fetch(`${BASE_URL}/cards/${cardId}`, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  const data = await res.json();
  return data.data as PokemonCard;
}

/**
 * Get multiple cards by their IDs (batched)
 */
export async function getCardsByIds(cardIds: string[]): Promise<PokemonCard[]> {
  if (cardIds.length === 0) return [];

  // API supports querying multiple IDs with OR
  const idQuery = cardIds.map((id) => `id:${id}`).join(" OR ");
  const params = new URLSearchParams({
    q: idQuery,
    pageSize: String(Math.min(cardIds.length, 250)),
  });

  const res = await fetch(`${BASE_URL}/cards?${params}`, {
    headers: getHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  const data = await res.json();
  return data.data as PokemonCard[];
}

/**
 * List all sets, sorted newest first
 */
export async function getSets(): Promise<PokemonSet[]> {
  const params = new URLSearchParams({
    orderBy: "-releaseDate",
    pageSize: "250",
  });

  const res = await fetch(`${BASE_URL}/sets?${params}`, {
    headers: getHeaders(),
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  const data = await res.json();
  return data.data as PokemonSet[];
}

/**
 * Get all cards in a set
 */
export async function getCardsInSet(setId: string): Promise<PokemonCard[]> {
  const params = new URLSearchParams({
    q: `set.id:${setId}`,
    pageSize: "250",
    orderBy: "number",
  });

  const res = await fetch(`${BASE_URL}/cards?${params}`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  const data = await res.json();
  return data.data as PokemonCard[];
}
