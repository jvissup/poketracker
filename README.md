# PokéTracker 🃏

A full-stack Pokémon card inventory and pricing system built with **Next.js 14**, **Prisma**, and **Neon Postgres**. Deploy in minutes to Vercel.

## Features

- 📦 **Collection Management** — Add, edit, and remove cards with condition, quantity, and purchase price
- 💰 **Live Pricing** — Sync market prices from the free [Pokémon TCG API](https://pokemontcg.io) (includes TCGPlayer data)
- 📈 **Portfolio Dashboard** — See total market value, cost basis, and gain/loss at a glance
- 📊 **Price History Charts** — Track how card prices trend over time (per card, up to 90 days)
- 🎯 **Set Completion Tracker** — See how close you are to completing each set
- 🤝 **Deal Analyzer** — Build a list of cards, apply a discount %, and get a fair deal price
- 📂 **CSV Import/Export** — Bulk import your existing collection or export for backup

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd pokemon-tracker
npm install
```

### 2. Set Up Your Database

Get a free serverless Postgres URL from [Neon](https://neon.tech) (recommended), [Supabase](https://supabase.com), or any Postgres provider.

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL
```

### 3. Run Database Migration

```bash
npm run db:push      # Push schema to your database
# OR for tracked migrations:
npm run db:migrate
```

### 4. (Optional) Get a Pokémon TCG API Key

The API works without a key but is rate-limited. For heavier use, get a free key at [dev.pokemontcg.io](https://dev.pokemontcg.io) and add it to `.env`:

```
POKEMON_TCG_API_KEY=your_key_here
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual deploy

1. Push your repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add your environment variables in Project Settings → Environment Variables:
   - `DATABASE_URL` — your Neon/Supabase Postgres URL
   - `POKEMON_TCG_API_KEY` — optional, for higher rate limits
4. Vercel will automatically run `prisma generate && next build` on deploy

---

## How Pricing Works

Prices are **not** fetched automatically on page load — you control when to sync. Click **Sync Prices** on the Dashboard to pull the latest TCGPlayer market prices for every card in your collection. Each sync stores a snapshot, which is what builds the price history charts over time.

**Recommended workflow:** Sync prices once a day or whenever you want a fresh read. Set up a Vercel cron job to automate this:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/prices/sync",
      "schedule": "0 9 * * *"
    }
  ]
}
```

> Note: Vercel cron jobs require a Pro plan. On the free tier, sync manually from the dashboard.

---

## CSV Import Format

The import endpoint accepts CSV files with these columns (column names are flexible):

| Column | Required | Notes |
|--------|----------|-------|
| `Card ID` | Recommended | e.g. `sv3-1` — used to fetch full metadata |
| `Card Name` | Yes (if no Card ID) | Fallback if Card ID is missing |
| `Set Name` | No | |
| `Card Number` | No | |
| `Condition` | No | NM, LP, MP, HP, DMG, PSA10, etc. |
| `Quantity` | No | Defaults to 1 |
| `Purchase Price` | No | Per card |
| `Notes` | No | |

The easiest way to get Card IDs is to export your collection first and use it as a template.

---

## Project Structure

```
pokemon-tracker/
├── app/
│   ├── page.tsx                 # Dashboard
│   ├── collection/page.tsx      # Collection inventory
│   ├── sets/page.tsx            # Set completion tracker
│   ├── deals/page.tsx           # Deal analyzer
│   └── api/                     # API routes
│       ├── cards/search/        # Card search (proxies Pokemon TCG API)
│       ├── collection/          # CRUD for collection items
│       ├── prices/sync/         # Sync prices from API
│       ├── prices/history/      # Price history per card
│       ├── import/              # CSV import
│       └── export/              # CSV export
├── components/                  # Shared UI components
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── pokemon-tcg.ts           # API wrapper
│   └── utils.ts                 # Helpers & formatters
└── prisma/
    └── schema.prisma            # Database schema
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma (Neon recommended) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| Deploy | Vercel |
| Pricing data | [Pokémon TCG API](https://docs.pokemontcg.io) (free) |
