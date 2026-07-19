"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Undo2 } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { LedgerRow } from "@/components/ui/LedgerRow";
import { TransactionForm } from "@/components/forms/transaction-form";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Transaction {
  id: string;
  accountId: string;
  category: string;
  type: string;
  amount: number;
  note: string;
  date: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface TransactionsContentProps {
  initialTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "transfer", label: "Transfer" },
];

export function TransactionsContent({
  initialTransactions,
  accounts,
  categories,
}: TransactionsContentProps) {
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    const { deleteTransaction } = await import("@/lib/actions/transactions");
    await deleteTransaction(id);
    setDeleting(null);
  }

  const grouped = useMemo(() => {
    const sorted = [...initialTransactions].filter(
      (t) => filter === "all" || t.type === filter
    );

    const groups: { label: string; items: Transaction[] }[] = [];
    for (const t of sorted) {
      const label = format(new Date(t.date), "MMMM yyyy");
      const g = groups.find((x) => x.label === label);
      if (g) g.items.push(t);
      else groups.push({ label, items: [t] });
    }
    return groups;
  }, [filter, initialTransactions]);

  return (
    <div>
      <PageHeading
        eyebrow="Ledger"
        title="Transactions"
        action={
          <AddButton label="Add" onClick={() => setShowForm(true)} />
        }
      />

      <TransactionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        accounts={accounts}
        categories={categories}
      />

      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter transactions"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={`pressable relative rounded-full border border-hair px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out ${
                active
                  ? "border-brand-600 text-paper-0"
                  : "border-line text-ink-700 hover:border-brand-500 hover:text-brand-700"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tx-filter"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  className="absolute inset-0 rounded-full bg-brand-600"
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: EASE }}
        >
          {grouped.length === 0 ? (
            <EmptyState />
          ) : (
            grouped.map((group) => (
              <section key={group.label} className="mb-6">
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                  {group.label}
                </h2>
                <Card className="px-4 py-1">
                  {group.items.map((t, i) => (
                    <LedgerRow
                      key={t.id}
                      index={i}
                      title={t.category}
                      subtitle={`${accounts.find((a) => a.id === t.accountId)?.name ?? "Account"} \u00B7 ${format(new Date(t.date), "MMM d")}`}
                      amount={
                        <Money
                          value={t.type === "income" ? t.amount : -t.amount}
                          signed
                          tone={
                            t.type === "income"
                              ? "positive"
                              : t.type === "expense"
                                ? "warning"
                                : "brand"
                          }
                          className={t.type === "income" ? "font-medium" : ""}
                        />
                      }
                      amountMeta={t.note}
                      action={
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting === t.id}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-all duration-150 hover:bg-warning-50 hover:text-warning-700 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Undo transaction"
                        >
                          <Undo2 size={15} strokeWidth={1.5} />
                        </button>
                      }
                    />
                  ))}
                </Card>
              </section>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-[15px] font-medium text-ink-900">
        Nothing here yet
      </p>
      <p className="mt-1 text-[13px] text-ink-400">
        No transactions match this filter.
      </p>
    </Card>
  );
}
