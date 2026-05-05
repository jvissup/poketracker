import { prisma } from "@/lib/db";
import { getCardsInSet, getSets } from "@/lib/pokemon-tcg";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Get all sets where the user has at least one card, ranked by completion %
async function getSetsData() {
  const collectionItems = await prisma.collectionItem.findMany({
    select: { setId: true, cardId: true },
  });

  if (collectionItems.length === 0) return [];

  // Group owned card IDs by set
  const ownedBySet = new Map<string, Set<string>>();
  for (const item of collectionItems) {
    if (!ownedBySet.has(item.setId)) {
      ownedBySet.set(item.setId, new Set());
    }
    ownedBySet.get(item.setId)!.add(item.cardId);
  }

  const setIds = [...ownedBySet.keys()].filter((id) => id !== "unknown");

  // Fetch set metadata
  const allSets = await getSets();
  const setMeta = new Map(allSets.map((s) => [s.id, s]));

  const results = await Promise.all(
    setIds.map(async (setId) => {
      const meta = setMeta.get(setId);
      if (!meta) return null;

      const owned = ownedBySet.get(setId)!.size;
      const total = meta.total;
      const percent = Math.round((owned / total) * 100);

      return {
        setId,
        name: meta.name,
        series: meta.series,
        total,
        owned,
        percent,
        logoUrl: meta.images?.logo ?? null,
        symbolUrl: meta.images?.symbol ?? null,
        releaseDate: meta.releaseDate ?? null,
      };
    })
  );

  return results
    .filter(Boolean)
    .sort((a, b) => b!.percent - a!.percent) as NonNullable<
    (typeof results)[number]
  >[];
}

export default async function SetsPage() {
  const sets = await getSetsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Set Completion</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Track your progress toward completing each set
        </p>
      </div>

      {sets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
          <p>No sets found in your collection yet.</p>
          <p className="mt-1">Add cards to start tracking set completion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sets.map((set) => (
            <div
              key={set.setId}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
            >
              {/* Set header */}
              <div className="flex items-center gap-3">
                {set.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={set.logoUrl}
                    alt={set.name}
                    className="h-8 object-contain max-w-[120px]"
                  />
                ) : (
                  <div className="h-8 flex items-center">
                    <span className="font-bold text-gray-800">{set.name}</span>
                  </div>
                )}
                <div className="ml-auto text-right">
                  <p className="text-xl font-bold text-gray-900">{set.percent}%</p>
                  <p className="text-xs text-gray-400">
                    {set.owned}/{set.total} cards
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    set.percent === 100
                      ? "bg-green-500"
                      : set.percent >= 75
                      ? "bg-blue-500"
                      : set.percent >= 50
                      ? "bg-yellow-400"
                      : "bg-orange-400"
                  )}
                  style={{ width: `${set.percent}%` }}
                />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{set.series}</span>
                {set.releaseDate && (
                  <span>Released {set.releaseDate}</span>
                )}
                {set.percent === 100 && (
                  <span className="ml-auto text-green-600 font-semibold flex items-center gap-1">
                    ✓ Complete
                  </span>
                )}
                {set.percent < 100 && (
                  <span className="ml-auto text-gray-500">
                    {set.total - set.owned} remaining
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
