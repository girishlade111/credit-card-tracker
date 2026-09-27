# Credit Card Tracker

A client-side dashboard for tracking credit/debit card sales, machine fees, and expected payment dates — aimed at merchants who accept cards on multiple POS terminals (e.g. Moderninha, SumUp, Cielo, GetNet). Add sales, manage card types and their fees per machine, visualize revenue with charts, and export/import your data as JSON.

> **Built by Girish Lade** — more free tools at [ladestack.in](https://ladestack.in)

## Features

- **Sales entry** — record card sales with amount, card type, and POS machine; fees and expected payout dates are computed automatically
- **Card-type management** — define card brands (Visa/Master, credit/debit) with per-card fee % and settlement delay in days
- **Machine management** — register POS terminals and set per-machine fee overrides for each card type
- **Dashboard views** — tabbed interface with sales calendar, analytics charts, sortable sales table, card-type table, and machine table
- **Payment tracking** — mark expected payments as received
- **Import / Export** — back up or restore all data as a JSON file
- **Dark mode** — theme toggle powered by `next-themes`
- **Fully client-side** — no backend, no login; all state lives in the browser (localStorage)

## Tech Stack

- **Next.js 15** (App Router, static export) + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives)
- **Recharts** for analytics charts
- **date-fns**, **react-hook-form**, **lucide-react**, **sonner** toasts

## Quick Start

```bash
# install dependencies
npm install

# run the dev server
npm run dev
# open http://localhost:3000

# production build (static export to ./out)
npm run build

# serve the static build
npx serve out
```

## Project Structure

```
app/                  # Next.js App Router (layout, page, globals.css)
components/
  dashboard.tsx       # Main tabbed dashboard
  card-tracker.tsx    # Sale entry / tracking logic
  card-types-table.tsx
  machines-table.tsx
  sales-calendar.tsx  # Calendar view of sales
  sales-charts.tsx    # Recharts analytics
  sales-table.tsx     # Sortable sales ledger
  ui/                 # shadcn/ui primitives
  theme-provider.tsx
lib/
  types.ts            # CardType, Machine, Sale, PaymentStatus types
  mock-data.ts        # Demo seed data (Brazilian POS machines)
  utils.ts            # Fee / business-day helpers
public/               # Static assets
styles/
```

## Environment Variables

None — the app runs entirely client-side with no secrets or API keys.

## Deployment

Static site. Build with `npm run build` (configured with `output: 'export'`, images unoptimized) and deploy the `out/` directory to any static host — GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

## License

Free to use and modify.
