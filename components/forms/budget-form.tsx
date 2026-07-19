"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { offlineAction } from "@/lib/offline";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string; type: string }[];
  editBudget?: {
    id: string;
    categoryId: string | null;
    amount: number;
    period: string;
  } | null;
}

export function BudgetForm({ open, onClose, categories, editBudget }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(editBudget?.categoryId ?? "");
  const [amount, setAmount] = useState(editBudget?.amount?.toString() ?? "");
  const [period, setPeriod] = useState(editBudget?.period ?? "monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBudget = offlineAction("createBudget");
  const updateBudgetAction = offlineAction("updateBudget");
  const trapRef = useFocusTrap(open, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = {
        categoryId: categoryId || undefined,
        amount: parseFloat(amount) || 0,
        period,
      };
      if (editBudget) {
        await updateBudgetAction(editBudget.id, data);
      } else {
        await createBudget(data);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px] sm:items-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-dialog-title"
        >
          <motion.div
            ref={trapRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.12 }}
            className="w-full max-w-md rounded-t-2xl border border-hair border-line bg-paper-0 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-hair border-line px-6 py-4">
              <div className="h-8 w-1 shrink-0 rounded-full bg-brand-600" />
              <div className="flex-1">
                <h2 id="budget-dialog-title" className="text-[16px] font-medium text-ink-900">
                  {editBudget ? "Edit budget" : "New budget"}
                </h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">
                    Category
                  </label>
                  <Select
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="All spending"
                    options={categories.filter((c) => c.type === "expense").map((c) => ({ value: c.id, label: c.name }))}
                  />
                  <p className="mt-1 text-[11px] text-ink-400">
                    Leave empty to set a budget on total spending
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">
                    Limit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">
                    Period
                  </label>
                  <Select value={period} onChange={setPeriod} options={PERIODS} />
                </div>

                {error && (
                  <p className="rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-[15px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : editBudget ? "Save changes" : "Create budget"}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
