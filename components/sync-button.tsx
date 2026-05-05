"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/prices/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Synced ${data.synced} cards`);
        router.refresh();
      } else {
        setMessage("Sync failed");
      }
    } catch {
      setMessage("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="text-sm text-gray-500">{message}</span>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
          syncing
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-50"
        )}
      >
        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
        {syncing ? "Syncing…" : "Sync Prices"}
      </button>
    </div>
  );
}
