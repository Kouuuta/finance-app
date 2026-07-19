"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, Metric } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { LedgerRow } from "@/components/ui/LedgerRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InstitutionIcon } from "@/components/ui/InstitutionIcon";
import { RepeatIcon, CircleDollarSignIcon } from "lucide-react";
import { useState } from "react";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { NetWorthChart } from "@/components/charts/net-worth-chart";

const EASE = [0.23, 1, 0.32, 1] as const;

const TYPE_LABEL: Record<string, string> = {
  ewallet: "E-wallet",
  bank: "Bank",
  savings: "Savings",
  bnpl: "Buy now, pay later",
  cash: "Cash",
  other: "Other",
};

interface DashboardData {
  accounts: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    exchangeRateToBase: number;
    institutionLogo: string | null;
    interestRateAnnual: number | null;
  }[];
  transactions: {
    id: string;
    accountId: string;
    toAccountId?: string;
    category: string;
    type: string;
    amount: number;
    note: string;
    tags?: string | null;
    currency: string;
    date: string;
  }[];
  netWorth: number;
  netWorthHistory: { date: string; value: number }[];
  monthlyIncome: number;
  monthlyExpense: number;
  expenseBreakdown: { name: string; value: number }[];
  budgetStatus: {
    id: string;
    categoryName: string | null;
    amount: number;
    period: string;
    spent: number;
  }[];
  autopay: {
    id: string;
    accountName: string;
    amount: number;
    type: string;
    note: string | null;
    frequency: string;
    interval: number;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
  }[];
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [showChart, setShowChart] = useState(false);

  const monthDelta = data.monthlyIncome - data.monthlyExpense;
  const recent = data.transactions.slice(0, 6);
  const hasExpenses = data.expenseBreakdown.length > 0;

  return (
    <div>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="mb-8"
      >
        <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-700">
          Total net worth
        </p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: EASE }}
          className="mt-2 font-display text-[44px] font-medium leading-none text-ink-900 sm:text-[56px]"
        >
          <Money value={data.netWorth} />
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: EASE }}
          className="mt-3 font-mono text-[13px] text-positive-700"
        >
          + <Money value={monthDelta} />{" "}
          <span className="text-ink-400">this month</span>
        </motion.p>
      </motion.section>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Card className="border-positive-600/20 bg-positive-50 p-4">
          <Metric label="Income">
            <Money value={data.monthlyIncome} tone="positive" className="text-[18px]" />
          </Metric>
        </Card>
        <Card className="border-warning-600/20 bg-warning-50 p-4">
          <Metric label="Expense">
            <Money value={data.monthlyExpense} tone="warning" className="text-[18px]" />
          </Metric>
        </Card>
      </div>

      <section className="mb-8">
        <SectionHeader
          title="Accounts"
          action={
            <button
              onClick={() => router.push("/accounts")}
              className="text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-600"
            >
              View all
            </button>
          }
        />
        <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.accounts.map((acc, i) => (
            <motion.button
              key={acc.id}
              onClick={() => router.push("/accounts")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: i * 0.04, ease: EASE }}
              className="pressable w-40 shrink-0 snap-start rounded-card border border-hair border-line bg-paper-0 p-4 text-left transition-colors duration-150 hover:border-brand-500"
            >
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hair ${
                  acc.type === "bnpl"
                    ? "border-warning-600/20 bg-warning-50 text-warning-700"
                    : "border-brand-500/20 bg-brand-50 text-brand-700"
                }`}
              >
                <InstitutionIcon
                  type={acc.type}
                  logoUrl={acc.institutionLogo}
                  institutionName={acc.name}
                  className="h-7 w-7 object-contain"
                />
              </div>
              <p className="truncate text-[13px] font-medium text-ink-900">
                {acc.name}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-ink-400">
                {TYPE_LABEL[acc.type]}
              </p>
              <p
                className={`mt-1.5 font-mono text-[14px] ${acc.type === "bnpl" ? "text-warning-700" : "text-ink-900"}`}
              >
                {acc.type === "bnpl" ? "\u2212 " : ""}
                <Money value={acc.balance} currency={acc.currency} />
              </p>
              {acc.type === "bnpl" && (
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-warning-700">
                  Owed
                </p>
              )}
              {acc.type === "savings" && acc.interestRateAnnual && (
                <p className="mt-1 font-mono text-[11px] text-positive-700">
                  +{" "}
                  <Money
                    value={
                      Math.round(
                        ((acc.balance * acc.interestRateAnnual) / 100 / 365) *
                          100
                      ) / 100
                    }
                    currency={acc.currency}
                  />{" "}
                  / day
                </p>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {data.budgetStatus.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Budget"
            action={
              <button
                onClick={() => router.push("/budget")}
                className="text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-600"
              >
                View all
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.budgetStatus.slice(0, 4).map((b, i) => {
              const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
              const isOver = b.spent > b.amount;
              return (
                <motion.button
                  key={b.id}
                  onClick={() => router.push("/budget")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.04, ease: EASE }}
                  className="pressable w-full rounded-card border border-hair border-line bg-paper-0 p-4 text-left transition-colors duration-150 hover:border-brand-500"
                >
                  <CircleDollarSignIcon
                    size={22}
                    strokeWidth={1.75}
                    className={`mb-3 ${isOver ? "text-warning-600" : "text-brand-700"}`}
                  />
                  <p className="truncate text-[13px] font-medium text-ink-900">
                    {b.categoryName || "All spending"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-ink-400">
                    <Money value={b.spent} /> of <Money value={b.amount} />
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.04 }}
                      className={`h-full rounded-full ${isOver ? "bg-warning-500" : "bg-brand-500"}`}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {data.autopay.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Autopay"
            action={
              <button
                onClick={() => router.push("/autopay")}
                className="text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-600"
              >
                View all
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.autopay.map((r, i) => (
              <motion.button
                key={r.id}
                onClick={() => router.push("/autopay")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: i * 0.04, ease: EASE }}
                className="pressable w-full rounded-card border border-hair border-line bg-paper-0 p-4 text-left transition-colors duration-150 hover:border-brand-500"
              >
                <RepeatIcon
                  size={22}
                  strokeWidth={1.75}
                  className="mb-3 text-brand-700"
                />
                <p className="truncate text-[13px] font-medium text-ink-900">
                  {r.note || `${r.type.charAt(0).toUpperCase() + r.type.slice(1)}`}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink-400">
                  {r.accountName} &middot; {r.frequency}{r.interval > 1 ? ` (every ${r.interval})` : ""}
                </p>
                <p
                  className={`mt-1.5 font-mono text-[14px] ${
                    r.type === "income" ? "text-emerald-600" : r.type === "expense" ? "text-warning-600" : "text-ink-700"
                  }`}
                >
                  <Money value={r.type === "expense" ? -r.amount : r.amount} />
                </p>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {data.netWorthHistory.length > 1 && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mb-8 overflow-hidden"
        >
          <SectionHeader title="Net worth history" />
          <Card className="p-4">
            <NetWorthChart data={data.netWorthHistory} />
          </Card>
        </motion.section>
      )}

      {hasExpenses && showChart && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mb-8 overflow-hidden"
        >
          <SectionHeader title="Spending breakdown" />
          <Card className="p-4">
            <ExpenseBreakdownChart data={data.expenseBreakdown} />
          </Card>
        </motion.section>
      )}

      <section>
        <SectionHeader
          title="Transactions"
          action={
            <div className="flex items-center gap-2">
              {hasExpenses && (
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="text-[13px] text-ink-400 transition-colors hover:text-brand-700"
                >
                  {showChart ? "Hide chart" : "Chart"}
                </button>
              )}
              <button
                onClick={() => router.push("/transactions")}
                className="text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-600"
              >
                View all
              </button>
            </div>
          }
        />
        <Card className="px-4 py-1">
          {recent.map((t, i) => (
            <LedgerRow
              key={t.id}
              index={i}
              title={t.category}
              subtitle={`${data.accounts.find((a) => a.id === t.accountId)?.name ?? "Account"} \u00B7 ${format(new Date(t.date), "MMM d")}`}
              amount={
                <Money
                  value={t.type === "income" ? t.amount : -t.amount}
                  signed
                  tone={t.type === "income" ? "positive" : t.type === "expense" ? "warning" : "brand"}
                  className={t.type === "income" ? "font-medium" : ""}
                />
              }
              amountMeta={t.note}
            />
          ))}
        </Card>
      </section>
    </div>
  );
}
