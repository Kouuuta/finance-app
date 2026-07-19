"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Undo2, PencilIcon, SearchIcon, X, UploadIcon } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { Card } from "@/components/ui/Card";
import { offlineAction } from "@/lib/offline";
import { Money } from "@/components/ui/Money";
import { LedgerRow } from "@/components/ui/LedgerRow";
import { TransactionForm } from "@/components/forms/transaction-form";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Transaction {
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
  totalCount: number;
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
  totalCount,
}: TransactionsContentProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteTransaction = offlineAction("deleteTransaction");

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteTransaction(id);
    setDeleting(null);
  }

  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const sorted = [...initialTransactions].filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (q && !t.category.toLowerCase().includes(q) && !t.note.toLowerCase().includes(q) && !(t.tags ?? "").toLowerCase().includes(q)) return false;
      const d = new Date(t.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    const groups: { label: string; items: Transaction[] }[] = [];
    for (const t of sorted) {
      const label = format(new Date(t.date), "MMMM yyyy");
      const g = groups.find((x) => x.label === label);
      if (g) g.items.push(t);
      else groups.push({ label, items: [t] });
    }
    return groups;
  }, [filter, searchQuery, dateFrom, dateTo, initialTransactions]);

  return (
    <div>
      <PageHeading
        eyebrow="Ledger"
        title="Transactions"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/import"
              aria-label="Import transactions"
              className="pressable inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
            >
              <UploadIcon size={16} strokeWidth={1.75} />
              <span className="hidden sm:inline">Import</span>
            </Link>
            <AddButton label="Add" onClick={() => setShowForm(true)} />
          </div>
        }
      />

      <TransactionForm
        open={showForm || !!editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        accounts={accounts}
        categories={categories}
        editTransaction={editing}
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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by category, note, or tag…"
            className="w-full rounded-lg border border-hair border-line bg-paper-0 py-2 pl-9 pr-8 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              <X size={15} strokeWidth={1.75} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
            className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3 py-2 text-[13px] text-ink-900 focus:border-brand-600 focus:outline-none sm:w-auto"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
            className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3 py-2 text-[13px] text-ink-900 focus:border-brand-600 focus:outline-none sm:w-auto"
          />
        </div>
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
            <EmptyState isEmpty={totalCount === 0} />
          ) : (
            grouped.map((group) => (
              <section key={group.label} className="mb-6">
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                  {group.label}
                </h2>
                <Card className="px-4 py-1">
                  {group.items.map((t, i) => {
                    const isTxTransfer = t.type === "transfer";
                    const srcName = accounts.find((a) => a.id === t.accountId)?.name ?? "Account";
                    const dstName = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId)?.name : null;
                    return (
                    <LedgerRow
                      key={t.id}
                      index={i}
                      title={isTxTransfer ? "Transfer" : t.category}
                      subtitle={isTxTransfer ? `${srcName} → ${dstName ?? "?"}` : `${srcName} · ${format(new Date(t.date), "MMM d")}`}
                      amount={
                        <Money
                          value={isTxTransfer ? -t.amount : t.type === "income" ? t.amount : -t.amount}
                          signed
                          currency={t.currency}
                          tone={
                            isTxTransfer
                              ? "brand"
                              : t.type === "income"
                                ? "positive"
                                : "warning"
                          }
                          className={t.type === "income" && !isTxTransfer ? "font-medium" : ""}
                        />
                      }
                      amountMeta={
                        <>
                          {isTxTransfer ? t.note : t.note}
                          {t.tags && (
                            <span className="ml-1.5 inline-flex gap-1">
                              {t.tags.split(",").map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-medium text-brand-700"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </span>
                          )}
                        </>
                      }
                      action={
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => setEditing(t)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-all duration-150 hover:bg-brand-50 hover:text-brand-700"
                            aria-label="Edit transaction"
                          >
                            <PencilIcon size={14} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting === t.id}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-all duration-150 hover:bg-warning-50 hover:text-warning-700 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Undo transaction"
                          >
                            <Undo2 size={15} strokeWidth={1.5} />
                          </button>
                        </div>
                      }
                    />
                    );
                  })}
                </Card>
              </section>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ isEmpty }: { isEmpty: boolean }) {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-[15px] font-medium text-ink-900">
        {isEmpty ? "No transactions yet" : "Nothing here"}
      </p>
      <p className="mt-1 text-[13px] text-ink-400">
        {isEmpty
          ? "Add your first transaction to get started."
          : "No transactions match this filter."}
      </p>
    </Card>
  );
}
