"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Download, Upload, Search, Trash2, Pencil, X, Check, ChevronDown } from "lucide-react";
import { CardSearchModal } from "@/components/card-search-modal";
import { PriceChart } from "@/components/price-chart";
import { formatCAD, cn, CONDITIONS } from "@/lib/utils";
import Papa from "papaparse";

interface CollectionItem {
  id: string;
  cardId: string;
  cardName: string;
  setName: string;
  cardNumber: string;
  rarity: string | null;
  imageSmall: string | null;
  condition: string;
  quantity: number;
  purchasePrice: number | null;
  notes: string | null;
  createdAt: string;
}

interface PriceSnapshot {
  recordedAt: string;
  marketPrice: number | null;
  normalMarket: number | null;
  holofoilMarket: number | null;
  reverseHoloMarket: number | null;
}

interface EditingItem {
  id: string;
  condition: string;
  quantity: number;
  purchasePrice: string;
  notes: string;
}

type PriceMap = Map<string, number | null>;

export default function CollectionPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<EditingItem | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceSnapshot[]>([]);
  const [priceMap, setPriceMap] = useState<PriceMap>(new Map());
  const [importing, setImporting] = useState(false);
  const [cadRate, setCadRate] = useState<number>(1.37); // fallback until loaded

  // Fetch exchange rate once on mount
  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => {
        if (d.rate) setCadRate(d.rate);
      })
      .catch(() => {/* keep fallback */});
  }, []);

  const fetchCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collection");
      const data = await res.json();
      setItems(data.data ?? []);

      if (data.data?.length > 0) {
        const ids = [...new Set(data.data.map((i: CollectionItem) => i.cardId))] as string[];
        const map = new Map<string, number | null>();
        await Promise.all(
          ids.map(async (cardId) => {
            const res = await fetch(`/api/prices/history?cardId=${cardId}&days=1`);
            const d = await res.json();
            const latest = d.data?.[d.data.length - 1]?.marketPrice ?? null;
            map.set(cardId, latest);
          })
        );
        setPriceMap(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleExpand = async (item: CollectionItem) => {
    if (expandedCard === item.id) {
      setExpandedCard(null);
      setPriceHistory([]);
      return;
    }
    setExpandedCard(item.id);
    const res = await fetch(`/api/prices/history?cardId=${item.cardId}&days=90`);
    const data = await res.json();
    setPriceHistory(data.data ?? []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this card from your collection?")) return;
    await fetch(`/api/collection/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/collection/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        condition: editing.condition,
        quantity: Number(editing.quantity),
        purchasePrice: editing.purchasePrice ? Number(editing.purchasePrice) : null,
        notes: editing.notes || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((i) => (i.id === editing.id ? data.data : i)));
      setEditing(null);
    }
  };

  const handleExport = () => window.open("/api/export", "_blank");

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: results.data }),
          });
          const data = await res.json();
          alert(`Imported ${data.imported} cards. ${data.failed} failed.`);
          fetchCollection();
        } finally {
          setImporting(false);
        }
      },
    });
    e.target.value = "";
  };

  const filtered = items.filter(
    (i) =>
      i.cardName.toLowerCase().includes(filter.toLowerCase()) ||
      i.setName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} unique cards · {items.reduce((s, i) => s + i.quantity, 0)} total
            {" · "}
            <span className="text-gray-400">Prices in CAD</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <label className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border rounded-lg cursor-pointer transition-colors",
            importing ? "opacity-50" : "hover:bg-gray-50"
          )}>
            <Upload className="w-4 h-4" />
            {importing ? "Importing…" : "Import CSV"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by name or set…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading collection…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {items.length === 0
              ? "Your collection is empty. Add a card to get started!"
              : "No cards match your filter."}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3">Card</th>
                <th className="px-4 py-3">Set</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Paid (CAD)</th>
                <th className="px-4 py-3 text-right">Market (CAD)</th>
                <th className="px-4 py-3 text-right">Value (CAD)</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const marketPriceUsd = priceMap.get(item.cardId) ?? null;
                const totalValueUsd =
                  marketPriceUsd != null ? marketPriceUsd * item.quantity : null;
                const isEditing = editing?.id === item.id;
                const isExpanded = expandedCard === item.id;

                return (
                  <>
                    <tr
                      key={item.id}
                      className={cn(
                        "group hover:bg-gray-50 transition-colors",
                        isExpanded && "bg-blue-50"
                      )}
                    >
                      {/* Thumbnail */}
                      <td className="px-4 py-2">
                        {item.imageSmall ? (
                          <img
                            src={item.imageSmall}
                            alt={item.cardName}
                            className="w-8 h-11 object-contain rounded"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-gray-100 rounded" />
                        )}
                      </td>

                      {/* Card name */}
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleExpand(item)}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left flex items-center gap-1"
                        >
                          {item.cardName}
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-gray-400 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                        <p className="text-xs text-gray-400">#{item.cardNumber}</p>
                      </td>

                      {/* Set */}
                      <td className="px-4 py-2 text-sm text-gray-500">{item.setName}</td>

                      {/* Condition */}
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <select
                            value={editing.condition}
                            onChange={(e) =>
                              setEditing({ ...editing, condition: e.target.value })
                            }
                            className="text-xs border rounded px-2 py-1 focus:outline-none"
                          >
                            {CONDITIONS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.value}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {item.condition}
                          </span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-2 text-right text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editing.quantity}
                            onChange={(e) =>
                              setEditing({ ...editing, quantity: Number(e.target.value) })
                            }
                            className="w-16 text-right border rounded px-2 py-1 text-xs focus:outline-none"
                          />
                        ) : (
                          <span className="text-gray-700">{item.quantity}</span>
                        )}
                      </td>

                      {/* Purchase price (stored & entered in CAD) */}
                      <td className="px-4 py-2 text-right text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={editing.purchasePrice}
                            onChange={(e) =>
                              setEditing({ ...editing, purchasePrice: e.target.value })
                            }
                            className="w-20 text-right border rounded px-2 py-1 text-xs focus:outline-none"
                          />
                        ) : (
                          // purchasePrice in DB is stored as entered by user (CAD)
                          item.purchasePrice != null
                            ? `$${item.purchasePrice.toFixed(2)}`
                            : "—"
                        )}
                      </td>

                      {/* Market price (USD from API → converted to CAD) */}
                      <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                        {formatCAD(marketPriceUsd, cadRate)}
                      </td>

                      {/* Total value */}
                      <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                        {formatCAD(totalValueUsd, cadRate)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setEditing({
                                    id: item.id,
                                    condition: item.condition,
                                    quantity: item.quantity,
                                    purchasePrice: item.purchasePrice?.toString() ?? "",
                                    notes: item.notes ?? "",
                                  })
                                }
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded price chart row — chart shows CAD prices */}
                    {isExpanded && (
                      <tr key={`${item.id}-expanded`}>
                        <td colSpan={9} className="bg-blue-50 px-8 py-4">
                          <PriceChart
                            snapshots={priceHistory}
                            cardName={item.cardName}
                            cadRate={cadRate}
                          />
                          {item.notes && (
                            <p className="mt-3 text-xs text-gray-500">
                              📝 {item.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <CardSearchModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchCollection}
        />
      )}
    </div>
  );
}
