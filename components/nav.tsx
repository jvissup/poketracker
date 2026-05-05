"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Layers,
  Calculator,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/sets", label: "Sets", icon: Layers },
  { href: "/deals", label: "Deal Analyzer", icon: Calculator },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#003A70] text-white flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#003A70]" />
          </div>
          <span className="font-bold text-lg tracking-tight">PokéTracker</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-blue-800 text-xs text-blue-300">
        Prices via Pokémon TCG API
      </div>
    </aside>
  );
}
