"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RepeatIcon, Trash2, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { AutopayForm } from "@/components/forms/autopay-form";
import { offlineAction } from "@/lib/offline";
import { format } from "date-fns";

interface AutopayRule {
  id: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  amount: number;
  type: string;
  note: string | null;
  tags: string | null;
  frequency: string;
  interval: number;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  monthOfYear: number | null;
  startDate: string;
  endDate: string | null;
  lastProcessed: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Props {
  autopay: AutopayRule[];
  accounts: Account[];
  categories: Category[];
}

const FREQ_LABELS: Record<string, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export function AutopayContent({ autopay, accounts, categories }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteAutopay = offlineAction("deleteRecurring");
  const updateAutopay = offlineAction("updateRecurring");

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteAutopay(id);
    setDeleting(null);
  }

  async function handleToggle(id: string, isActive: boolean) {
    await updateAutopay(id, { isActive: !isActive });
  }

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <div>
      <PageHeading
        eyebrow="Automation"
        title="Autopay"
        action={<AddButton label="Add" onClick={() => setShowForm(true)} />}
      />

      <p className="mb-6 text-[13px] text-ink-400">
        Set up automatic bills, subscriptions, and recurring transfers
      </p>

      <AutopayForm
        open={showForm}
        onClose={() => setShowForm(false)}
        accounts={accounts}
        categories={categories}
      />

      <div className="mt-6 space-y-3">
        {autopay.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-400">
            No autopay rules yet. Add one to automate your regular payments.
          </p>
        )}

        {autopay.map((r) => (
          <motion.div key={r.id} layout>
            <Card>
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hair ${
                    r.isActive
                      ? "border-brand-500/20 bg-brand-50 text-brand-700"
                      : "border-line bg-paper-50 text-ink-400"
                  }`}
                >
                  <RepeatIcon size={20} strokeWidth={1.75} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-ink-900">
                      {r.note || `${r.type.charAt(0).toUpperCase() + r.type.slice(1)}`}
                    </span>
                    {!r.isActive && (
                      <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-500">
                    <span>{accountMap.get(r.accountId) ?? "Unknown"}</span>
                    <span className="text-ink-300">·</span>
                    <span className="capitalize">{r.frequency}</span>
                    {r.interval > 1 && <span>every {r.interval} {FREQ_LABELS[r.frequency]}s</span>}
                    <span className="text-ink-300">·</span>
                    <span>Since {format(new Date(r.startDate), "MMM d, yyyy")}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`text-[15px] font-medium tabular-nums ${
                      r.type === "income"
                        ? "text-emerald-600"
                        : r.type === "expense"
                          ? "text-warning-600"
                          : "text-ink-700"
                    }`}
                  >
                    <Money value={r.type === "expense" ? -r.amount : r.amount} />
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-hair border-line pt-3">
                <button
                  onClick={() => handleToggle(r.id, r.isActive)}
                  className="pressable flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {r.isActive ? <ToggleRightIcon size={14} /> : <ToggleLeftIcon size={14} />}
                  {r.isActive ? "Active" : "Paused"}
                </button>

                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="pressable flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-ink-500 transition-colors hover:bg-warning-50 hover:text-warning-700 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="mt-4 px-1 text-[12px] text-ink-400">
        Autopay rules are processed daily at 6 AM.
      </p>
    </div>
  );
}
