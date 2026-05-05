"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Plus, Loader2, ChevronDown, Globe, Layers } from "lucide-react";
import { cn, CONDITIONS } from "@/lib/utils";
import { CARD_LANGUAGES } from "@/lib/pokemon-tcg";
import type { PokemonCard } from "@/lib/pokemon-tcg";

interface SlimSet {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate: string | null;
  symbolUrl: string | null;
}

interface Props {
  onClose: () => void;
  onAdded?: () => void;
}

export function CardSearchModal({ onClose, onAdded }: Props) {
  // ── Search filters ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [setSearch, setSetSearch] = useState("");
  const [showSetDropdown, setShowSetDropdown] = useState(false);
  const [sets, setSets] = useState<SlimSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);

  // ── Search results ──────────────────────────────────────────────────────────
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Selected card & form ────────────────────────────────────────────────────
  const [selected, setSelected] = useState<PokemonCard | null>(null);
  const [condition, setCondition] = useState("NM");
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setDropdownRef = useRef<HTMLDivElement>(null);

  // Load sets once on modal open
  useEffect(() => {
    setSetsLoading(true);
    fetch("/api/sets")
      .then((r) => r.json())
      .then((d) => setSets(d.data ?? []))
      .catch(() => setSets([]))
      .finally(() => setSetsLoading(false));
  }, []);

  // Close set dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        setDropdownRef.current &&
        !setDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSetDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Search logic (fires on name query OR when set/language changes) ─────────
  const runSearch = useCallback(
    (nameQuery: string, setId: string, language: string) => {
      clearTimeout(debounceRef.current);

      // Need at least a name query (≥2 chars) OR a set selected
      if (nameQuery.trim().length < 2 && !setId) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        setHasSearched(true);
        try {
          const params = new URLSearchParams({ pageSize: "24" });
          if (nameQuery.trim()) params.set("q", nameQuery.trim());
          if (setId) params.set("setId", setId);
          if (language) params.set("language", language);

          const res = await fetch(`/api/cards/search?${params}`);
          const data = await res.json();
          setResults(data.data ?? []);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 350);
    },
    []
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    runSearch(value, selectedSetId, selectedLanguage);
  };

  const handleSetSelect = (setId: string) => {
    setSelectedSetId(setId);
    setShowSetDropdown(false);
    setSetSearch("");
    runSearch(query, setId, selectedLanguage);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    runSearch(query, selectedSetId, lang);
  };

  const clearSet = () => {
    setSelectedSetId("");
    setSetSearch("");
    runSearch(query, "", selectedLanguage);
  };

  // ── Filtered set list for the combobox ─────────────────────────────────────
  const filteredSets = sets.filter(
    (s) =>
      s.name.toLowerCase().includes(setSearch.toLowerCase()) ||
      s.series.toLowerCase().includes(setSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(setSearch.toLowerCase())
  );

  const selectedSet = sets.find((s) => s.id === selectedSetId);
  const selectedLang = CARD_LANGUAGES.find((l) => l.value === selectedLanguage);

  // ── Add card to collection ──────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selected.id,
          cardName: selected.name,
          setId: selected.set.id,
          setName: selected.set.name,
          cardNumber: selected.number,
          rarity: selected.rarity,
          imageSmall: selected.images.small,
          imageLarge: selected.images.large,
          supertype: selected.supertype,
          subtypes: selected.subtypes,
          condition,
          quantity,
          purchasePrice: purchasePrice ? Number(purchasePrice) : null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdded?.();
      onClose();
    } catch {
      setError("Failed to add card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="font-semibold text-lg">Add Card to Collection</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!selected ? (
            <>
              {/* ── Filter bar ──────────────────────────────────────────── */}
              <div className="space-y-2">
                {/* Name search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by card name…"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Set + Language filters row */}
                <div className="flex gap-2">
                  {/* Set combobox */}
                  <div ref={setDropdownRef} className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setShowSetDropdown((v) => !v)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors text-left",
                        showSetDropdown
                          ? "border-blue-500 ring-2 ring-blue-500"
                          : "hover:border-gray-400",
                        selectedSetId ? "text-gray-900" : "text-gray-400"
                      )}
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="flex-1 truncate">
                        {selectedSet ? selectedSet.name : "All sets"}
                      </span>
                      {selectedSetId ? (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSet();
                          }}
                          className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      ) : (
                        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showSetDropdown && "rotate-180")} />
                      )}
                    </button>

                    {showSetDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-20 flex flex-col max-h-72">
                        {/* Set search input */}
                        <div className="p-2 border-b shrink-0">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search sets…"
                            value={setSearch}
                            onChange={(e) => setSetSearch(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>

                        <div className="overflow-y-auto">
                          {setsLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                          ) : filteredSets.length === 0 ? (
                            <p className="py-4 text-center text-xs text-gray-400">No sets match</p>
                          ) : (
                            filteredSets.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSetSelect(s.id)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left border-b last:border-0 transition-colors",
                                  s.id === selectedSetId && "bg-blue-50"
                                )}
                              >
                                {s.symbolUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={s.symbolUrl}
                                    alt=""
                                    className="w-5 h-5 object-contain shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {s.series} · {s.total} cards
                                    {s.releaseDate && ` · ${s.releaseDate}`}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Language selector */}
                  <div className="relative w-48 shrink-0">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full appearance-none pl-8 pr-7 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    >
                      {CARD_LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Active filter pills */}
                {(selectedSetId || selectedLanguage !== "en") && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSet && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        <Layers className="w-3 h-3" />
                        {selectedSet.name}
                        <button onClick={clearSet} className="hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedLanguage !== "en" && selectedLang && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                        <Globe className="w-3 h-3" />
                        {selectedLang.label}
                        <button
                          onClick={() => handleLanguageChange("en")}
                          className="hover:text-purple-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Results grid ──────────────────────────────────────────── */}
              {results.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {results.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelected(card)}
                      className="border rounded-xl p-3 text-left hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      {card.images?.small && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.images.small}
                          alt={card.name}
                          className="w-full h-auto rounded-lg mb-2"
                        />
                      )}
                      <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600">
                        {card.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {card.set.name} · #{card.number}
                      </p>
                      {card.rarity && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{card.rarity}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!searching && hasSearched && results.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm space-y-1">
                  <p>No cards found.</p>
                  <p className="text-xs">Try adjusting your name, set, or language filters.</p>
                </div>
              )}

              {!hasSearched && !searching && (
                <div className="py-8 text-center text-gray-300 text-sm">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Type a name or select a set to search</p>
                </div>
              )}
            </>
          ) : (
            /* ── Selected card detail form ──────────────────────────────── */
            <div className="space-y-5">
              <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl">
                {selected.images?.small && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.images.small}
                    alt={selected.name}
                    className="w-[72px] rounded-lg shrink-0"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">
                    {selected.set.name} · #{selected.number}
                  </p>
                  {selected.rarity && (
                    <p className="text-sm text-gray-400">{selected.rarity}</p>
                  )}
                  {selectedLanguage !== "en" && selectedLang && (
                    <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs">
                      <Globe className="w-3 h-3" />
                      {selectedLang.label}
                    </span>
                  )}
                  <button
                    onClick={() => setSelected(null)}
                    className="mt-2 text-xs text-blue-600 hover:underline block"
                  >
                    ← Choose a different card
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price per card (CAD, optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bought at locals, first edition…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {selected && (
          <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                saving
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add to Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
