"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface InvestmentFormProps {
  open: boolean;
  onClose: () => void;
}

export function InvestmentForm({ open, onClose }: InvestmentFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("stock");
  const [symbol, setSymbol] = useState("");
  const [units, setUnits] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { createInvestment } = await import("@/lib/actions/investments");
      await createInvestment({
        name,
        type,
        symbol: symbol.toUpperCase(),
        units: parseFloat(units) || 0,
        costBasis: parseFloat(costBasis) || 0,
        currentPrice: parseFloat(currentPrice) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create investment");
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
        >
          <motion.div
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
                <h2 className="text-[16px] font-medium text-ink-900">Add holding</h2>
              </div>
              <button onClick={onClose} className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="Ayala Land"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                  <option value="mutual_fund">Mutual fund</option>
                  <option value="mp2">Pag-IBIG MP2</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="ALI"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Units
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Cost basis (total)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costBasis}
                  onChange={(e) => setCostBasis(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink-700">
                  Current price (per unit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 focus:border-brand-600 focus:outline-none"
                  placeholder="30.00"
                />
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
                {submitting ? "Adding…" : "Add holding"}
              </button>
            </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
