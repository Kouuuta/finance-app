"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { offlineAction } from "@/lib/offline";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface EditTransaction {
  id: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  type: string;
  note?: string | null;
  tags?: string | null;
  date: string;
}

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
  editTransaction?: EditTransaction | null;
}

export function TransactionForm({
  open,
  onClose,
  accounts,
  categories,
  editTransaction,
}: TransactionFormProps) {
  const isEditing = !!editTransaction;
  const [accountId, setAccountId] = useState(editTransaction?.accountId ?? accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(editTransaction?.toAccountId ?? "");
  const [categoryId, setCategoryId] = useState(editTransaction?.categoryId ?? "");
  const [type, setType] = useState(editTransaction?.type ?? "expense");
  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : "");
  const [note, setNote] = useState(editTransaction?.note ?? "");
  const [tags, setTags] = useState<string[]>(
    editTransaction?.tags ? editTransaction.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  );
  const [tagInput, setTagInput] = useState("");
  const [date, setDate] = useState(editTransaction?.date ?? new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = offlineAction("createTransaction");
  const updateTransaction = offlineAction("updateTransaction");
  const trapRef = useFocusTrap(open, onClose);

  const isTransfer = type === "transfer";

  useEffect(() => {
    if (editTransaction) {
      setAccountId(editTransaction.accountId);
      setToAccountId(editTransaction.toAccountId ?? "");
      setCategoryId(editTransaction.categoryId ?? "");
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setNote(editTransaction.note ?? "");
      setTags(
        editTransaction.tags ? editTransaction.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
      );
      setTagInput("");
      setDate(editTransaction.date.split("T")[0]);
      setError(null);
    }
  }, [editTransaction]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing && editTransaction) {
        await updateTransaction(editTransaction.id, {
          accountId,
          toAccountId: isTransfer ? toAccountId : null,
          categoryId: isTransfer ? null : categoryId || null,
          amount: parseFloat(amount) || 0,
          type,
          note: note || null,
          tags: tags.length > 0 ? tags.join(",") : null,
          date: new Date(date),
        });
      } else {
        await createTransaction({
          accountId,
          toAccountId: isTransfer ? toAccountId : undefined,
          categoryId: (isTransfer ? undefined : categoryId) || undefined,
          amount: parseFloat(amount) || 0,
          type,
          note: note || undefined,
          tags: tags.length > 0 ? tags.join(",") : undefined,
          date: new Date(date),
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
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
          aria-labelledby="tx-dialog-title"
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
                <h2 id="tx-dialog-title" className="text-[16px] font-medium text-ink-900">
                  {isEditing ? "Edit transaction" : "Add transaction"}
                </h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                {["expense", "income", "transfer"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`pressable flex-1 rounded-full border border-hair py-2 text-[13px] font-medium transition-colors ${
                      type === t
                        ? "border-brand-600 bg-brand-600 text-paper-0"
                        : "border-line text-ink-700 hover:border-brand-500"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {isTransfer ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[13px] font-medium text-ink-700">
                      From
                    </label>
                    <Select
                      value={accountId}
                      onChange={(v) => {
                        setAccountId(v);
                        if (v === toAccountId) setToAccountId("");
                      }}
                      options={accounts.map((a) => ({
                        value: a.id,
                        label: a.name,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-medium text-ink-700">
                      To
                    </label>
                    <Select
                      value={toAccountId}
                      onChange={setToAccountId}
                      placeholder="Select"
                      options={accounts
                        .filter((a) => a.id !== accountId)
                        .map((a) => ({ value: a.id, label: a.name }))}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">
                    Account
                  </label>
                  <Select
                    value={accountId}
                    onChange={setAccountId}
                    options={accounts.map((a) => ({
                      value: a.id,
                      label: a.name,
                    }))}
                  />
                </div>
              )}

              {!isTransfer && (
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">
                    Category
                  </label>
                  <Select
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="Uncategorized"
                    options={categories
                      .filter((c) => c.type === type || c.type === "transfer")
                      .map((cat) => ({ value: cat.id, label: cat.name }))}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Note
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="Optional note"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-hair border-line bg-paper-0 px-3 py-2 focus-within:border-brand-600">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Remove tag ${tag}`}
                        className="hover:text-brand-900"
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const t = tagInput.trim().replace(/,/g, "");
                        if (t && !tags.includes(t)) {
                          setTags((prev) => [...prev, t]);
                        }
                        setTagInput("");
                      }
                      if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                        setTags((prev) => prev.slice(0, -1));
                      }
                    }}
                    className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
                    placeholder="Type and press Enter"
                  />
                </div>
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
                {submitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {submitting ? "Saving…" : isEditing ? "Update transaction" : "Add transaction"}
              </button>
            </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
