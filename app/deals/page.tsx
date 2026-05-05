"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Tag,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCAD, cn } from "@/lib/utils";
import type { PokemonCard } from "@/lib/pokemon-tcg";

interface DealCard {
  card: PokemonCard;
  quantity: number;
  marketPrice: number | null;
}

function getBestPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;
  return (
    prices.holofoil?.market ??
    prices.normal?.market ??
    prices.reverseHolofoil?.market ??
    null
  );
}

export default function DealsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [dealCards, setDealCards] = useState<DealCard[]>([]);
  const [discount, setDiscount] = useState(20);
  const [showResults, setShowResults] = useState(false);
  const [cadRate, setCadRate] = useState<number>(1.37);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => { if (d.rate) setCadRate(d.rate); })
      .catch(() => {/* keep fallback */});
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setShowResults(true);
      try {
        const res = await fetch(
          `/api/cards/search?q=${encodeURIComponent(value)}&pageSize=8`
        );
        const data = await res.json();
        setResults(data.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const addCard = (card: PokemonCard) => {
    const marketPrice = getBestPrice(card);
    const existing = dealCards.find((d) => d.card.id === card.id);
    if (existing) {
      setDealCards((prev) =>
        prev.map((d) =>
          d.card.id === card.id ? { ...d, quantity: d.quantity + 1 } : d
        )
      );
    } else {
      setDealCards((prev) => [...prev, { card, quantity: 1, marketPrice }]);
    }
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const removeCard = (cardId: string) => {
    setDealCards((prev) => prev.filter((d) => d.card.id !== cardId));
  };

  const updateQty = (cardId: string, qty: number) => {
    if (qty < 1) return;
    setDealCards((prev) =>
      prev.map((d) => (d.card.id === cardId ? { ...d, quantity: qty } : d))
    );
  };

  // Totals
  const totalMarket = dealCards.reduce((sum, d) => {
    return sum + (d.marketPrice ?? 0) * d.quantity;
  }, 0);

  const dealPrice = totalMarket * (1 - discount / 100);
  const savings = totalMarket - dealPrice;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deal Analyzer</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Add cards, set a discount, and see if a deal is worth taking.{" "}
          <span className="text-gray-400">Prices in CAD · 1 USD = ${cadRate.toFixed(4)} CAD</span>
        </p>
      </div>

      {/* Card search */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Add Cards to This Deal</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a card to add…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}

          {/* Dropdown results */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 max-h-72 overflow-y-auto">
              {results.map((card) => {
                const price = getBestPrice(card);
                return (
                  <button
                    key={card.id}
                    onClick={() => addCard(card)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b last:border-0"
                  >
                    {card.images?.small && (
                      <img
                        src={card.images.small}
                        alt={card.name}
                        className="w-8 h-11 object-contain rounded shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {card.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {card.set.name} · #{card.number}
                        {card.rarity && ` · ${card.rarity}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {price != null ? formatCAD(price, cadRate) : "No price"}
                      </p>
                      <p className="text-xs text-gray-400">market</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Deal cards list */}
      {dealCards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Cards in This Deal</h2>
            <span className="text-sm text-gray-500">{dealCards.length} cards</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2 w-10"></th>
                <th className="px-4 py-2">Card</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Market (each)</th>
                <th className="px-4 py-2 text-right">Subtotal</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dealCards.map((d) => (
                <tr key={d.card.id} className="group">
                  <td className="px-4 py-2">
                    {d.card.images?.small && (
                      <img
                        src={d.card.images.small}
                        alt={d.card.name}
                        className="w-8 h-11 object-contain rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {d.card.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.card.set.name} · #{d.card.number}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => updateQty(d.card.id, d.quantity - 1)}
                        className="w-6 h-6 rounded border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{d.quantity}</span>
                      <button
                        onClick={() => updateQty(d.card.id, d.quantity + 1)}
                        className="w-6 h-6 rounded border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-600">
                    {formatCAD(d.marketPrice, cadRate)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-800">
                    {d.marketPrice != null
                      ? formatCAD(d.marketPrice * d.quantity, cadRate)
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeCard(d.card.id)}
                      className="p-1.5 rounded hover:bg-red-100 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deal Calculator */}
      {dealCards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">Deal Calculator</h2>
          </div>

          {/* Discount slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Discount off market value
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Math.min(99, Math.max(0, Number(e.target.value))))
                  }
                  className="w-16 text-center border rounded px-2 py-1 text-sm font-semibold focus:outline-none"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0% (market)</span>
              <span>80% off</span>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Market Value</span>
              <span className="font-medium text-gray-800">
                {formatCAD(totalMarket, cadRate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount ({discount}%)</span>
              <span className="font-medium text-red-500">
                -{formatCAD(savings, cadRate)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-3">
              <span className="text-gray-800">Fair Deal Price</span>
              <span className="text-blue-600 text-xl">{formatCAD(dealPrice, cadRate)}</span>
            </div>
          </div>

          {/* Verdict */}
          <div
            className={cn(
              "rounded-xl p-4 text-sm font-medium text-center",
              discount >= 30
                ? "bg-green-50 text-green-700"
                : discount >= 15
                ? "bg-yellow-50 text-yellow-700"
                : "bg-gray-50 text-gray-600"
            )}
          >
            {discount >= 30 ? (
              <>🔥 Great deal — {discount}% below market is a solid buy</>
            ) : discount >= 15 ? (
              <>✅ Decent deal — {discount}% below market, room to negotiate more</>
            ) : discount > 0 ? (
              <>⚠️ Thin margin — only {discount}% below market</>
            ) : (
              <>💡 Use the slider to set a target discount</>
            )}
          </div>
        </div>
      )}

      {dealCards.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-gray-400">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No cards added yet</p>
          <p className="text-xs mt-1">
            Search for cards above to start building a deal
          </p>
        </div>
      )}
    </div>
  );
}
