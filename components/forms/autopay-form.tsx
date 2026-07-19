"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { offlineAction } from "@/lib/offline";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface AutopayFormProps {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
}

export function AutopayForm({ open, onClose, accounts, categories }: AutopayFormProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [intervalVal, setIntervalVal] = useState("1");
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate().toString());
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAutopay = offlineAction("createRecurring");
  const trapRef = useFocusTrap(open, onClose);
  const isTransfer = type === "transfer";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createAutopay({
        accountId,
        toAccountId: isTransfer ? toAccountId : undefined,
        categoryId: isTransfer ? undefined : categoryId || undefined,
        amount: parseFloat(amount) || 0,
        type,
        note: note || undefined,
        frequency,
        interval: parseInt(intervalVal) || 1,
        dayOfMonth: frequency === "monthly" || frequency === "yearly" ? parseInt(dayOfMonth) : undefined,
        dayOfWeek: frequency === "weekly" ? parseInt(dayOfWeek) : undefined,
        startDate: new Date(startDate),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create autopay rule");
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
          aria-labelledby="autopay-dialog-title"
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
                <h2 id="autopay-dialog-title" className="text-[16px] font-medium text-ink-900">New autopay rule</h2>
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
                    <label className="mb-1 block text-[13px] font-medium text-ink-700">From</label>
                    <Select
                      value={accountId}
                      onChange={(v) => { setAccountId(v); if (v === toAccountId) setToAccountId(""); }}
                      options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-medium text-ink-700">To</label>
                    <Select
                      value={toAccountId}
                      onChange={setToAccountId}
                      placeholder="Select"
                      options={accounts.filter((a) => a.id !== accountId).map((a) => ({ value: a.id, label: a.name }))}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">Account</label>
                  <Select
                    value={accountId}
                    onChange={setAccountId}
                    options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  />
                </div>
              )}

              {!isTransfer && (
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">Category</label>
                  <Select
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="Uncategorized"
                    options={categories.filter((c) => c.type === type || c.type === "transfer").map((cat) => ({ value: cat.id, label: cat.name }))}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">Amount</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">Frequency</label>
                  <Select value={frequency} onChange={setFrequency} options={FREQUENCIES} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">Every</label>
                  <input
                    type="number"
                    min="1"
                    value={intervalVal}
                    onChange={(e) => setIntervalVal(e.target.value)}
                    className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              {frequency === "weekly" && (
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">Day of week</label>
                  <Select
                    value={dayOfWeek}
                    onChange={setDayOfWeek}
                    options={[
                      { value: "0", label: "Sunday" },
                      { value: "1", label: "Monday" },
                      { value: "2", label: "Tuesday" },
                      { value: "3", label: "Wednesday" },
                      { value: "4", label: "Thursday" },
                      { value: "5", label: "Friday" },
                      { value: "6", label: "Saturday" },
                    ]}
                  />
                </div>
              )}

              {(frequency === "monthly" || frequency === "yearly") && (
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink-700">Day of month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">Note</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="Rent, subscription, etc."
                />
              </div>

              {error && (
                <p className="rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-[15px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create autopay rule"}
              </button>
            </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
