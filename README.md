# Vault (Unfinished Project)

Personal finance tracker. Track accounts, transactions, investments, budgets, and recurring payments — online and off.

## Features

- **Dashboard** — net worth snapshot, monthly income/expense cards, net worth chart, spending breakdown, recent transactions, active budgets, upcoming autopay rules
- **Multi-currency accounts** — bank, e-wallet, savings (with daily interest accrual), buy-now-pay-later, cash, with per-account currency and exchange rates
- **Transactions** — categorized expenses, income, and transfers with tags, full transaction history with date filtering
- **Autopay** — recurring bills, subscriptions, and transfers with daily automated processing (6 AM cron)
- **Budget** — per-category and overall spending limits with animated progress bars, auto-resets weekly/monthly/yearly
- **Investments** — stocks, crypto, mutual funds, Pag-IBIG MP2 with manual price updates, cost basis tracking, gain/loss calculation
- **Goals** — savings goals with target amounts and deadlines, contribute/withdraw tracking
- **CSV import** — bulk transaction import with column mapping and preview
- **PWA** — installable on mobile/desktop with offline support via service worker
- **Offline queue** — mutations are queued when offline and replayed automatically on reconnect
- **Dark mode** — theme toggle with system preference detection
- **Keyboard accessible** — focus trapping on dialogs, skip-to-content link, aria labels throughout
- **Responsive** — bottom tab navigation on mobile, rail navigation on desktop

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS, Framer Motion, Lucide icons |
| Database | PostgreSQL via Supabase, Prisma ORM |
| Auth | Supabase SSR |
| Charts | Recharts |
| Offline | Dexie.js (IndexedDB queue) |
| Dates | date-fns |
| Deployment | Vercel + Supabase |

## Getting started

```bash
# install dependencies
pnpm install

# copy environment variables
cp .env.example .env

# push schema to database
pnpm prisma db push

# seed sample data
pnpm prisma db seed

# start dev server
pnpm dev
```

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=         # your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # your Supabase anonymous key
CRON_SECRET=                       # shared secret for cron endpoint auth
```

## Project structure

```
app/
  (main)/
    page.tsx                       # dashboard
    DashboardContent.tsx
    accounts/                      # account management
    autopay/                       # recurring payments
    budget/                        # spending limits
    categories/                    # transaction categories
    goals/                         # savings goals
    import/                        # CSV import
    investments/                   # portfolio tracking
    settings/                      # user settings
    transactions/                  # transaction history
  api/cron/
    accrue-interest/               # daily interest cron
    process-recurring/             # daily autopay cron
  auth/callback/                   # Supabase auth callback
  manifest.ts                      # PWA manifest
  globals.css                      # global styles
  layout.tsx                       # root layout with PWA + offline banner
components/
  charts/                          # Recharts components
  forms/                           # bottom-sheet form dialogs
  layout/                          # AppShell, PageHeading, nav
  theme/                           # ThemeProvider, ThemeToggle
  ui/                              # Card, Money, Select, etc.
lib/
  actions/                         # server actions (+ offline replay)
  queries.ts                       # data fetching functions
  offline.ts                       # offlineAction wrapper
  sync.ts                          # Dexie queue helpers
  db.ts                            # IndexedDB schema
  supabase/                        # Supabase client helpers
  prisma.ts                        # Prisma client singleton
prisma/
  schema.prisma                    # database schema
  seed.ts                          # sample data seeder
proxy.ts                            # auth middleware
```

## Deployment

1. Deploy to Vercel with `vercel`
2. Connect to Supabase project
3. Set environment variables in Vercel dashboard
4. Push schema: `pnpm prisma db push`
5. Cron jobs are configured in `vercel.json`:
   - `0 0 * * *` — daily interest accrual
   - `0 6 * * *` — daily autopay processing

## License

MIT
