"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CircleDollarSignIcon, PencilIcon, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { BudgetForm } from "@/components/forms/budget-form";
import { offlineAction } from "@/lib/offline";

interface BudgetItem {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  period: string;
  spent: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Props {
  budgets: BudgetItem[];
  categories: Category[];
}

const PERIOD_LABELS: Record<string, string> = {
  weekly: "this week",
  monthly: "this month",
  yearly: "this year",
};

export function BudgetContent({ budgets, categories }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteBudget = offlineAction("deleteBudget");

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteBudget(id);
    setDeleting(null);
  }

  const summary = budgets.reduce(
    (acc, b) => {
      acc.totalBudget += b.amount;
      acc.totalSpent += Math.min(b.spent, b.amount);
      acc.over += Math.max(0, b.spent - b.amount);
      return acc;
    },
    { totalBudget: 0, totalSpent: 0, over: 0 }
  );

  return (
    <div>
      <PageHeading
        eyebrow="Planning"
        title="Budget"
        action={<AddButton label="Add" onClick={() => setShowForm(true)} />}
      />

      <p className="mb-6 text-[13px] text-ink-400">
        Set spending limits per category
      </p>

      <BudgetForm
        open={showForm || !!editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        categories={categories}
        editBudget={editing ? { id: editing.id, categoryId: editing.categoryId, amount: editing.amount, period: editing.period } : null}
      />

      {budgets.length > 1 && (
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-500">Budgeted</span>
            <span className="font-medium text-ink-900"><Money value={summary.totalBudget} /></span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[13px]">
            <span className="text-ink-500">Spent</span>
            <span className="font-medium text-ink-900"><Money value={summary.totalSpent} /></span>
          </div>
          {summary.over > 0 && (
            <div className="mt-1 flex items-center justify-between text-[13px]">
              <span className="text-ink-500">Over</span>
              <span className="font-medium text-warning-600">+<Money value={summary.over} /></span>
            </div>
          )}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((summary.totalSpent / summary.totalBudget) * 100, 100)}%` }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className={`h-full rounded-full transition-colors ${
                summary.totalSpent > summary.totalBudget
                  ? "bg-warning-500"
                  : summary.totalSpent > summary.totalBudget * 0.8
                    ? "bg-warning-400"
                    : "bg-brand-500"
              }`}
            />
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {budgets.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-400">
            No budgets yet. Create one to track your spending.
          </p>
        )}

        {budgets.map((b) => {
          const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
          const isOver = b.spent > b.amount;
          const isWarning = !isOver && pct >= 80;

          return (
            <motion.div key={b.id} layout>
              <Card>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hair ${
                      isOver
                        ? "border-warning-600/20 bg-warning-50 text-warning-700"
                        : isWarning
                          ? "border-warning-400/20 bg-warning-50/50 text-warning-600"
                          : "border-brand-500/20 bg-brand-50 text-brand-700"
                    }`}
                  >
                    <CircleDollarSignIcon size={20} strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium text-ink-900">
                        {b.categoryName || "All spending"}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-mono text-[18px] font-medium text-ink-900">
                        <Money value={b.spent} />
                      </span>
                      <span className="text-[13px] text-ink-400">
                        of <Money value={b.amount} /> {PERIOD_LABELS[b.period]}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
                        className={`h-full rounded-full transition-colors ${
                          isOver ? "bg-warning-500" : isWarning ? "bg-warning-400" : "bg-brand-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditing(b)}
                      aria-label="Edit budget"
                      className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <PencilIcon size={16} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deleting === b.id}
                      aria-label="Delete budget"
                      className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-warning-50 hover:text-warning-700 disabled:opacity-50"
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
