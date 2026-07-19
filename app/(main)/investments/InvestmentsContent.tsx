"use client";

import { motion } from "framer-motion";
import { Trash2, PencilIcon } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { LedgerRow } from "@/components/ui/LedgerRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InvestmentForm } from "@/components/forms/investment-form";
import { useState } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol: string;
  units: number;
  costBasis: number;
  currentPrice: number;
}

interface InvestmentsContentProps {
  investments: Investment[];
}

const TYPE_LABEL: Record<string, string> = {
  stock: "Stock",
  crypto: "Crypto",
  mutual_fund: "Mutual fund",
  mp2: "Pag-IBIG MP2",
};

export function InvestmentsContent({ investments }: InvestmentsContentProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const value = investments.reduce((s, i) => s + i.units * i.currentPrice, 0);
  const cost = investments.reduce((s, i) => s + i.costBasis, 0);
  const gain = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

  function investmentValue(inv: Investment) {
    return inv.units * inv.currentPrice;
  }

  function investmentGain(inv: Investment) {
    return investmentValue(inv) - inv.costBasis;
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const { deleteInvestment } = await import("@/lib/actions/investments");
    await deleteInvestment(id);
    setDeleting(null);
  }

  async function handleUpdatePrice(id: string) {
    if (!priceInput) return;
    setUpdating(id);
    const { updateInvestmentPrice } = await import("@/lib/actions/investments");
    await updateInvestmentPrice(id, parseFloat(priceInput) || 0);
    setUpdating(null);
    setEditingPrice(null);
    setPriceInput("");
  }

  return (
    <div>
      <PageHeading
        eyebrow="Portfolio"
        title="Investments"
        action={
          <AddButton label="Add holding" onClick={() => setShowForm(true)} />
        }
      />

      <InvestmentForm open={showForm} onClose={() => setShowForm(false)} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="mb-8"
      >
        <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-700">
          Portfolio value
        </p>
        <p className="mt-2 font-display text-[36px] font-medium leading-none text-ink-900 sm:text-[42px]">
          <Money value={value} />
        </p>
        <p className="mt-3 font-mono text-[13px] text-positive-700">
          + <Money value={gain} />{" "}
          <span className="text-ink-400">
            ({gainPct >= 0 ? "+" : "\u2212"}
            {Math.abs(gainPct).toFixed(1)}%) all time
          </span>
        </p>
      </motion.div>

      <SectionHeader title="Holdings" />

      {investments.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-ink-900">No holdings yet</p>
          <p className="mt-1 text-[13px] text-ink-400">
            Add your first investment holding to track its value.
          </p>
        </Card>
      ) : (
      <Card className="px-4 py-1">
        {investments.map((inv, i) => {
          const g = investmentGain(inv);
          const gp = inv.costBasis > 0 ? (g / inv.costBasis) * 100 : 0;
          return (
            <div key={inv.id} className="group">
              <LedgerRow
                index={i}
                leading={
                  <span className="font-mono text-[11px] font-medium text-brand-700">
                    {inv.symbol.slice(0, 3)}
                  </span>
                }
                title={inv.name}
                subtitle={`${TYPE_LABEL[inv.type] ?? inv.type} \u00B7 ${inv.units} units`}
                amount={<Money value={investmentValue(inv)} tone="brand" />}
                amountMeta={
                  <span
                    className={`font-mono ${g >= 0 ? "text-positive-700" : "text-warning-700"}`}
                  >
                    {g >= 0 ? "+" : "\u2212"} <Money value={Math.abs(g)} /> (
                    {gp >= 0 ? "+" : "\u2212"}
                    {Math.abs(gp).toFixed(1)}%)
                  </span>
                }
                action={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPrice(editingPrice === inv.id ? null : inv.id);
                        setPriceInput(String(inv.currentPrice));
                      }}
                      className="pressable flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-all hover:bg-brand-50 hover:text-brand-700 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Update price"
                    >
                      <PencilIcon size={13} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      disabled={deleting === inv.id}
                      className="pressable flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-all hover:bg-warning-50 hover:text-warning-700 disabled:cursor-not-allowed md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Delete holding"
                    >
                      {deleting === inv.id ? (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Trash2 size={14} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                }
              />
              {editingPrice === inv.id && (
                <div className="mb-3 mt-1 flex items-center gap-2 pl-14">
                  <input
                    type="number"
                    step="0.01"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-28 rounded-md border border-hair border-line px-2.5 py-1.5 text-right font-mono text-[13px] text-ink-900 focus:border-brand-600 focus:outline-none"
                    placeholder="Price per unit"
                  />
                  <button
                    onClick={() => handleUpdatePrice(inv.id)}
                    disabled={updating === inv.id || !priceInput}
                    className="pressable flex h-8 items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 text-[12px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Save price"
                  >
                    {updating === inv.id ? (
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    onClick={() => { setEditingPrice(null); setPriceInput(""); }}
                    className="pressable flex h-8 items-center justify-center rounded-lg border border-hair border-line px-2.5 text-[12px] text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </Card>
      )}

      <p className="mt-4 px-1 text-[12px] text-ink-400">
        Prices are updated manually. Cost basis <Money value={cost} />.
      </p>
    </div>
  );
}
