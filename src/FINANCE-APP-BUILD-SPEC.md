# Finance Tracker Web App — Build Spec

## Overview

A personal finance web app (Lemoneyd-style) for tracking expenses, savings, and investments manually — no bank/API linking required. Users add accounts, log transactions, set savings goals, and track investment holdings with manually-updated prices.

Single-user mode — no authentication (demo user seeded on every first load).

## Stack

- **Framework:** Next.js 16, App Router, TypeScript
- **Styling:** Tailwind CSS v4 (custom tokens via `@theme`)
- **ORM/DB:** Prisma + SQLite
- **Auth:** None — single demo user (`demo@finance.app` / no password check)
- **Data mutations:** Server Actions (no separate REST API layer)
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Data Model (Prisma schema)

```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  name          String?
  createdAt     DateTime   @default(now())
  accounts      Account[]
  transactions  Transaction[]
  categories    Category[]
  savingsGoals  SavingsGoal[]
  investments   Investment[]
}

model Account {
  id                      String       @id @default(cuid())
  userId                  String
  user                    User         @relation(fields: [userId], references: [id])
  name                    String
  type                    String       // "ewallet" | "bank" | "savings" | "bnpl" | "cash"
  institutionId           String?
  institution             Institution? @relation(fields: [institutionId], references: [id])
  balance                 Float        @default(0)
  interestRateAnnual      Float?       // p.a. %, only used when type === "savings"
  lastInterestAccrualDate DateTime?    // prevents double-crediting if the cron runs twice in a day
  transactions            Transaction[]
  createdAt               DateTime     @default(now())
}

model Category {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  name         String
  type         String        // "income" | "expense"
  isDefault    Boolean       @default(false)
  transactions Transaction[]
}

model Transaction {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  accountId  String
  account    Account   @relation(fields: [accountId], references: [id])
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
  amount     Float
  type       String    // "income" | "expense" | "transfer"
  note       String?
  date       DateTime
  createdAt  DateTime  @default(now())
}

model SavingsGoal {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  targetAmount  Float
  currentAmount Float     @default(0)
  deadline      DateTime?
  createdAt     DateTime  @default(now())
}

model Investment {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  name         String
  type         String   // "stock" | "crypto" | "mutual_fund" | "mp2"
  symbol       String
  units        Float
  costBasis    Float    // total cost, not per-unit
  currentPrice Float
  updatedAt    DateTime @updatedAt
}

model Institution {
  id       String    @id @default(cuid())
  name     String    @unique
  type     String    // "ewallet" | "bank" | "bnpl" | "cash" | "other"
  icon     String    // tabler icon class name (fallback if no logo)
  logoUrl  String?   // path to official brand logo, e.g. /logos/gcash.png
  accounts Account[]
}
```

## UI Design System

**Direction:** elegant, modern, minimal — a personal ledger/statement. Think private banking app, not fintech startup.

### Color

| Token      | Hex Light | Hex Dark        | Use                                             |
| ---------- | --------- | --------------- | ----------------------------------------------- |
| `ink-900`  | `#12120F` | `#FAF9F6`       | Primary text, headline figures, primary buttons |
| `ink-700`  | `#4A4944` | `#D3D2CB`       | Secondary text, icons, labels                   |
| `ink-400`  | `#A8A69C` | `#9D9B92`       | Muted text, section labels, placeholders        |
| `paper-50` | `#FAF9F6` | `#12120F`       | Page background                                 |
| `paper-0`  | `#FFFFFF` | `#1D1D19`       | Card/surface background                         |
| `line`     | `#E7E5DE` | `#3E3D37`       | Hairline borders and dividers                   |
| `brand`    | black     | white           | Accent (pill buttons, active tab)               |
| `positive` | emerald   | emerald / light | Income, gains, interest earned                  |
| `warning`  | rose      | rose / light    | Expenses, BNPL owed, losses, errors             |

### Typography

| Role    | Typeface                       | Where                                                               |
| ------- | ------------------------------ | ------------------------------------------------------------------- |
| Display | Fraunces (serif), weight 500   | Big money figures — net worth, account balances                     |
| Body/UI | Inter, weights 400/500         | Labels, nav, body copy, buttons                                     |
| Numeric | IBM Plex Mono, weights 400/500 | Every number in a list or table — right-aligned so decimals line up |

### Component tokens

- Cards: `paper-0` background, `0.5px solid line` border, `10px` radius
- Metric label: `12–13px`, `ink-400`, sits above the value
- Ledger row: `py-3`, `0.5px solid line` top border, flex `space-between`
- No shadows, no gradients — flat surfaces throughout

### Signature element

The **ledger line**: every list of data (transactions, accounts, holdings, goal contributions) sits on a hairline rule with a right-aligned mono figure — the one repeated device that ties every page together, like a printed bank statement.

## Institution Reference Table

| Institution | Account type | Logo file                |
| ----------- | ------------ | ------------------------ |
| GCash       | `ewallet`    | `/logos/gcash.png`       |
| Maya        | `ewallet`    | `/logos/maya.png`        |
| MariBank    | `bank`       | `/logos/maribank.png`    |
| BDO         | `bank`       | `/logos/bdo.svg`         |
| BPI         | `bank`       | `/logos/bpi.png`         |
| PSBank      | `bank`       | `/logos/psbank.png`      |
| Atome       | `bnpl`       | `/logos/atome.png`       |
| Cash        | `cash`       | — (lucide icon fallback) |
| Other       | `other`      | — (lucide icon fallback) |

`Account.type` enum: `"ewallet" | "bank" | "savings" | "bnpl" | "cash"`. Atome's balance nets _against_ net worth (subtract, not add).

## Savings Interest Accrual

When an account's type is `savings`, the account form shows an additional field: **interest rate (% p.a.)**. The system then accrues interest daily and posts it as a transaction.

**Formula:**

```
dailyInterest = balance * (interestRateAnnual / 100) / 365
```

**How it works:**

1. On every dashboard/accounts page load, each savings account with `interestRateAnnual` set is accrued from `lastInterestAccrualDate + 1` to today
2. Each day's interest compounds on the previous day's new balance
3. A `Transaction` record is created: `type: "income"`, `category: "Interest"`
4. Idempotent: skips if already accrued today

**Edge case:** if the app has been unused for days, catch up all missed days at once with compounding.

## Current Folder Structure

```
app/
  (main)/
    layout.tsx              # AppShell (desktop rail + bottom nav)
    page.tsx                # Dashboard server page
    DashboardContent.tsx    # Dashboard client component
    accounts/page.tsx       # Accounts server page
    accounts/AccountsContent.tsx
    transactions/page.tsx
    transactions/TransactionsContent.tsx
    goals/page.tsx
    goals/GoalsContent.tsx
    investments/page.tsx
    investments/InvestmentsContent.tsx
    loading.tsx
    error.tsx
  api/
    cron/accrue-interest/route.ts
lib/
  prisma.ts
  queries.ts            # Server-side data fetchers + auto-accrue interest
  format.ts
  fonts.ts
  utils.ts
  actions/
    accounts.ts
    transactions.ts
    goals.ts
    investments.ts
    interest.ts
components/
  ui/     (Card, LedgerRow, Money, SectionHeader, InstitutionIcon, AddButton, Metric)
  layout/ (AppShell, PageHeading)
  theme/  (ThemeProvider, ThemeToggle)
  forms/  (account-form, transaction-form, goal-form, investment-form)
  charts/ (expense-breakdown-chart)
prisma/
  schema.prisma
  seed.ts
public/
  logos/     (gcash.png, maya.png, maribank.png, bdo.svg, bpi.png, psbank.png, atome.png)
```

---

# Build Log & Remaining Work

## ✅ Completed work

### Dashboard

- Net worth with monthly income/expense delta
- Income/expense metric cards (green/red)
- Horizontally scrollable account cards with institution logos, type label, balance, daily interest for savings
- Recent transactions list
- Expense breakdown donut chart (expandable)

### Accounts page

- Card grid (2-col mobile, 3-col desktop) with institution logos
- Type labels, savings interest rate + daily interest display
- Delete button per card with balance-safe removal
- Net worth summary at top
- Sections: "Spending & savings" / "Owed (nets against total)"

### Account form ("Manage accounts")

- Type filter chips (Bank / E-wallet / Savings / Cash / BNPL / Other)
- Institution logo grid filtered by type map (banks appear under Bank + Savings, ewallets under E-wallet + Savings)
- Institution type inferred from selection, name auto-filled
- Interest rate field for savings accounts
- **"Your accounts" section**: shows existing accounts of the selected type with inline balance editing (+ Enter key support)
- **"Add new" section**: logo grid + name/balance/rate fields
- Loading spinner on submit, error banner on duplicate
- Server-side duplicate (institution+type) prevention

### Transactions page

- Type filter tabs (All / Income / Expense / Transfer)
- Grouped by month
- Undo button per row — reverses balance (income: subtracts, expense: adds back)
- `LedgerRow` component supports `action` slot

### Goals page

- Create goals with name, target amount, optional deadline
- Progress bars with animation
- Saved / Remaining display

### Investments page

- Create holdings (stock / crypto / mutual fund / MP2)
- Portfolio value + gain/loss summary
- Holdings list with per-unit gain/loss

### Interest accrual

- `accrueInterestForAccount`: daily `balance * rate / 100 / 365`, compounds across days
- `accrueAllInterest`: batch accrual for all savings accounts
- Cron endpoint: `GET /api/cron/accrue-interest` (auth via `CRON_SECRET`)
- Auto-accrual on dashboard + accounts page load (no cron setup needed)
- Creates "Daily interest" income transactions with "Interest" category

### Theme

- Light/dark mode toggle
- Custom CSS variables in `app/globals.css` with `@theme inline`
- `prefers-reduced-motion` respected

### Navigation

- Desktop rail (left sidebar, icons + tooltip labels)
- Mobile bottom nav (5 tabs: Home / Accounts / Ledger / Goals / Invest)
- Active tab indicator with spring animation (`layoutId`)

### UI Polishes

- Touch targets expanded to 36–40px minimum on icon buttons
- Loading spinners on async buttons (account form)
- Error inline feedback (account form)
- `pressable` CSS class with `scale(0.97)` on active
- `whileTap` on account cards
- Server errors caught and displayed in form

---

## 📋 Remaining Work (Prioritized)

### 🔴 High

| #   | Task                                                                                                                    | Files involved                                                                               | Notes                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | **Net worth chart** — line chart on dashboard showing net worth over time                                               | `components/charts/net-worth-chart.tsx`, `app/(main)/DashboardContent.tsx`, `lib/queries.ts` | Per spec Phase 3. Needs historical snapshots or computes from transaction data |
| 2   | **Delete goal button** — `deleteGoal` action exists, wire trash icon onto goal cards                                    | `app/(main)/goals/GoalsContent.tsx`                                                          |                                                                                |
| 3   | **Goal contribution UI** — `contributeToGoal` action exists, add "Add progress" button + amount input on each goal card | `app/(main)/goals/GoalsContent.tsx`                                                          | Needs account picker (source of funds)                                         |
| 4   | **Delete investment button** — `deleteInvestment` action exists, wire trash icon onto holdings                          | `app/(main)/investments/InvestmentsContent.tsx`                                              |                                                                                |
| 5   | **Investment price update** — `updateInvestmentPrice` action exists, add inline price edit on holdings                  | `app/(main)/investments/InvestmentsContent.tsx`                                              |                                                                                |

### 🟡 Medium

| #   | Task                                                                                 | Files involved                                                                                                    | Notes                                                   |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 6   | **Loading/error states** on transaction, goal, and investment forms                  | `components/forms/transaction-form.tsx`, `components/forms/goal-form.tsx`, `components/forms/investment-form.tsx` | Copy pattern from account-form (spinner + error banner) |
| 7   | **Transaction date picker** — currently always uses `new Date()`, needs a date input | `components/forms/transaction-form.tsx`                                                                           |                                                         |
| 8   | **Transaction edit** — no way to edit amount/note/category after creation            | `components/forms/transaction-form.tsx` + `lib/actions/transactions.ts`                                           | `updateTransaction` action may need creation            |
| 9   | **Account full edit** — can only update balance, not name/type/institution           | `components/forms/account-form.tsx`                                                                               |                                                         |
| 10  | **`.env` file** — `DATABASE_URL` and `CRON_SECRET` must exist for local dev          | `.env`                                                                                                            | SQLite path + cron auth key                             |

### 🟢 Low

| #   | Task                                                                               | Files involved                                    | Notes                                |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| 11  | **Search/filter transactions** — keyword search or date range                      | `app/(main)/transactions/TransactionsContent.tsx` |                                      |
| 12  | **Transfer two-sided** — creating a transfer should credit destination account too | `lib/actions/transactions.ts`                     | Currently only debits source account |
| 13  | **Demo seed data** — pre-populate with sample accounts, transactions, goals        | `prisma/seed.ts`                                  | Helpful for demo/testing             |
| 14  | **`vercel.json`** — cron schedule `0 0 * * *` for interest accrual                 | `vercel.json`                                     | Needed only if deploying to Vercel   |
| 15  | **PWA + Offline** (Phase 5)                                                        | Multiple files                                    | Deferred — see Phase 5 section below |

---

## Phase 5 — PWA + Offline Support (Deferred)

**Goal:** Installable, works offline. Dexie.js local-first. Background sync on reconnect.

### Files

| File                              | Action                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `public/manifest.json`            | Create — app name, monochrome icons, `display: "standalone"`                            |
| `next.config.ts`                  | Add `withPWA` plugin configuration                                                      |
| `lib/db.ts`                       | Create — Dexie.js IndexedDB wrapper (accounts, transactions, goals, investments tables) |
| `lib/sync.ts`                     | Create — sync queue, push pending writes on reconnect                                   |
| `components/ui/SyncIndicator.tsx` | Create — status dot (synced / pending / offline)                                        |
| `app/(main)/layout.tsx`           | Add `<SyncIndicator>` to DesktopRail + BottomNav                                        |
| `lib/actions/*.ts`                | Add Dexie write-through to all mutation actions                                         |

**Definition of done:**

- `npm run build` generates service worker
- "Add to Home Screen" prompt works on mobile
- App loads and renders cached data offline
- Writes made offline sync when connection returns
- Sync indicator shows current status

---

## Appendix

### Notes

- No bank/e-wallet API linking — all data is manually entered
- Keep money values as Float for MVP simplicity
- Single demo user: `demo@finance.app` / no password check (auth removed)
- Interest rate: percent per annum, stored as float (e.g. 3.5 = 3.5% p.a.)
- Cron endpoint protected by `CRON_SECRET` env var; auto-accrual on page load means cron is optional

---

# Revised Build Plan (July 2026)

> The original "Remaining Work" section above is **outdated** — all high-priority items and most medium items were already implemented during initial builds. The plan below supersedes it.

## Current State (spec vs reality audit)

| Original # | Task                          | Actual status                                                                |
| ---------- | ----------------------------- | ---------------------------------------------------------------------------- |
| 1          | Net worth chart               | ✅ Done — `components/charts/net-worth-chart.tsx` exists, wired in dashboard |
| 2          | Delete goal button            | ✅ Done — trash icon in `GoalsContent.tsx`                                   |
| 3          | Goal contribution UI          | ✅ Done — inline form with amount + account picker                           |
| 4          | Delete investment button      | ✅ Done — trash icon in `InvestmentsContent.tsx`                             |
| 5          | Investment price update       | ✅ Done — inline price edit in `InvestmentsContent.tsx`                      |
| 6          | Loading/error states on forms | ✅ Done — all 3 forms (goal, investment, transaction) have spinner + error   |
| 7          | Transaction date picker       | ✅ Done — `<input type="date">` in `transaction-form.tsx`                    |
| 8          | Transaction edit              | ❌ Not implemented                                                           |
| 9          | Account full edit             | ❌ Form only exposes balance edit; action supports name/type                 |
| 10         | `.env` file                   | ✅ Done                                                                      |
| 11         | Search/filter transactions    | ❌ Only type filter tabs, no keyword or date range                           |
| 12         | Transfer two-sided            | ❌ Only debits source, never credits destination                             |
| 13         | Demo seed data                | ❌ Only user + institutions + categories, no mock finances                   |
| 14         | `vercel.json`                 | ✅ Done                                                                      |
| 15         | PWA + Offline                 | ❌ Not started                                                               |

### Code quality notes

- `lib/format.ts` and `lib/utils.ts` both export identical `cn()` function — deduplicate
- Accounts page has **no empty state** for brand-new users
- `deleteAccount({ where: { id, userId } })` — `userId` is not part of any unique constraint; may cause TS/Prisma issues or silently ignore the filter

---

## Phase 0 — Bug Fixes (do first)

| #   | Bug                                         | Files                                                                                          | Fix                                                                                                                                                                                     |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | **"This month" income/expense is all-time** | `lib/queries.ts:31-37`                                                                         | `monthlyIncome`/`monthlyExpense` sum every transaction ever with no date filter. Add `.filter(t => isSameMonth(t.date, new Date()))` before reducing                                    |
| 0.2 | **Transfers destroy money**                 | `prisma/schema.prisma`, `lib/actions/transactions.ts`, `components/forms/transaction-form.tsx` | Schema: add `toAccountId` to Transaction model. Action: credit destination when type=transfer. Form: show From/To account selectors. Ledger: render transfers as neutral (no green/red) |
| 0.3 | **Account ownership check**                 | `lib/actions/accounts.ts`, `prisma/schema.prisma`                                              | `delete({ where: { id, userId } })` only has `id` as unique field. Either add `@@unique([id, userId])` or switch to `deleteMany`                                                        |

---

## Phase 1 — Supabase Postgres + Auth

### 1a. Database: SQLite → Supabase Postgres

| Step                 | File(s)                | Change                                                                                                                                                                         |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Update `.env`        | `.env`                 | Replace `DATABASE_URL` with Supabase Postgres connection string. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`                  |
| Update Prisma schema | `prisma/schema.prisma` | `provider = "sqlite"` → `"postgresql"`. Remove `@default(cuid())` on User `id` (Supabase provides UUID). Optionally add `@@unique([id, userId])` on Account, Transaction, etc. |
| Push schema          | —                      | `npx prisma db push`                                                                                                                                                           |
| Re-seed              | `prisma/seed.ts`       | Institutions + categories only (no mock data yet)                                                                                                                              |

### 1b. Auth setup

| Step                       | Files                        | Detail                                                                                                        |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Install packages           | —                            | `npm i @supabase/supabase-js @supabase/ssr`                                                                   |
| Supabase browser client    | `lib/supabase/client.ts`     | `createBrowserClient(url, anonKey)`                                                                           |
| Supabase server client     | `lib/supabase/server.ts`     | `createServerClient(url, anonKey, { cookies })` using `next/cookies`                                          |
| Supabase middleware client | `lib/supabase/middleware.ts` | `createServerClient` for `next/server` middleware                                                             |
| Auth routes                | `app/(auth)/login/page.tsx`  | Email/password + social login form                                                                            |
|                            | `app/(auth)/signup/page.tsx` | Sign-up form with email/password                                                                              |
|                            | `app/auth/callback/route.ts` | OAuth/PKCE redirect handler                                                                                   |
| Middleware                 | `middleware.ts`              | Protect `(main)/*` routes; redirect unauthenticated to `/login`                                               |
| Session provider           | `app/layout.tsx`             | Wrap root with Supabase session listener                                                                      |
| Rewrite server actions     | `lib/actions/*.ts`           | Replace `prisma.user.findFirst()` with `supabase.auth.getUser()` → lookup/create Prisma User by Supabase UUID |

**Design rule:** Prisma `User.id` = Supabase Auth `user.id` (UUID). On first login after auth, auto-create the Prisma User row.

---

## Phase 2 — UI / Feature Improvements

| #   | Task                             | Files                                                                            | Detail                                                                                                                                                                                                                                                           |
| --- | -------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **Transfer UI overhaul**         | `transaction-form.tsx`, `LedgerRow.tsx`, `TransactionsContent.tsx`               | From/To account selectors for transfers. Neutral ledger display (brand tone, not positive/warning)                                                                                                                                                               |
| 2.2 | **Account full editing**         | `account-form.tsx`                                                               | Add edit mode for existing accounts: change name/type/institution/rate. Action `updateAccount` already supports all fields                                                                                                                                       |
| 2.3 | **Transaction editing**          | `lib/actions/transactions.ts`, `transaction-form.tsx`, `TransactionsContent.tsx` | New `updateTransaction` action + edit button (pencil) on ledger rows → pre-filled form modal                                                                                                                                                                     |
| 2.4 | **Search / filter transactions** | `TransactionsContent.tsx`                                                        | Keyword search input + date range picker. Store in URL search params for shareability                                                                                                                                                                            |
| 2.5 | **Empty states audit**           | `AccountsContent.tsx` (missing), `TransactionsContent.tsx` (partial)             | Add empty state to Accounts page. Update Transactions empty state to show "No transactions yet" when truly zero (not just "nothing matches filter")                                                                                                              |
| 2.6 | **Demo seed data**               | `prisma/seed.ts`                                                                 | Mock accounts (GCash ₱2,500, BDO savings ₱50k, BPI checking ₱15k, Atome -₱1,200). Transactions over 3 months (salary, food, transport, bills, coffee, freelance). One goal ("Emergency fund" ₱100k / ₱12k saved). Two investments (ALI 100 units, BTC 0.5 units) |

---

## Phase 3 — Polish & Additional

| #   | Task                                   | Detail                                                                                                                  |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 3.1 | `@@unique([id, userId])` on all models | Ownership safety at DB level for Account, Transaction, SavingsGoal, Investment, Category                                |
| 3.2 | `.env.example`                         | Template with all required vars for contributors                                                                        |
| 3.3 | Deduplicate `cn()`                     | Remove duplicate from `lib/format.ts` or `lib/utils.ts`                                                                 |
| 3.4 | Recurring transactions                 | New `RecurringTransaction` model with frequency + next date. Cron to create transactions on schedule                    |
| 3.5 | Budget tracking                        | Per-category monthly budget with progress bars on dashboard / transactions page                                         |
| 3.6 | CSV export                             | Download transactions as CSV from transactions page                                                                     |
| 3.7 | A11y pass                              | `aria-label` on icon-only buttons, keyboard nav, focus-visible rings, skip-to-content link                              |
| 3.8 | Net worth snapshot model               | `NetWorthSnapshot` table with daily snapshots (accurate even with balance edits, investment changes, interest accruals) |
| 3.9 | PWA + Offline (Phase 5)                | `manifest.json`, service worker via `next-pwa` or similar, Dexie.js local-first cache, sync indicator                   |

---
