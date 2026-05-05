import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PokéTracker — Card Inventory & Pricing",
  description: "Track your Pokémon card collection, monitor prices, and analyze deals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 ml-56 p-8 max-w-7xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
