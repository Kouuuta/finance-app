"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { GoalForm } from "@/components/forms/goal-form";
import { useState } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

interface GoalsContentProps {
  goals: Goal[];
  accounts: { id: string; name: string }[];
}

export function GoalsContent({ goals, accounts }: GoalsContentProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [contribState, setContribState] = useState<Record<string, { amount: string; account: string }>>({});
  const [contributing, setContributing] = useState<string | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  function getState(goalId: string) {
    return contribState[goalId] ?? { amount: "", account: accounts[0]?.id ?? "" };
  }

  function setField(goalId: string, field: "amount" | "account", value: string) {
    setContribState((prev) => ({
      ...prev,
      [goalId]: { ...getState(goalId), [field]: value },
    }));
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const { deleteGoal } = await import("@/lib/actions/goals");
    await deleteGoal(id);
    setDeleting(null);
  }

  async function handleContribute(goalId: string) {
    const st = getState(goalId);
    if (!st.account || !st.amount) return;
    setContributing(goalId);
    const { contributeToGoal } = await import("@/lib/actions/goals");
    await contributeToGoal(goalId, parseFloat(st.amount) || 0, st.account);
    setContributing(null);
    setShowContribute(null);
    setContribState((prev) => {
      const next = { ...prev };
      delete next[goalId];
      return next;
    });
  }

  return (
    <div>
      <PageHeading
        eyebrow="Saving toward"
        title="Goals"
        action={<AddButton label="New goal" onClick={() => setShowForm(true)} />}
      />

      <GoalForm open={showForm} onClose={() => setShowForm(false)} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="mb-8"
      >
        <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-700">
          Saved of <Money value={totalTarget} />
        </p>
        <p className="mt-2 font-display text-[36px] font-medium leading-none text-ink-900 sm:text-[42px]">
          <Money value={totalSaved} />
        </p>
      </motion.div>

      {goals.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-ink-900">No goals yet</p>
          <p className="mt-1 text-[13px] text-ink-400">
            Create a savings goal to track your progress.
          </p>
        </Card>
      ) : (
      <div className="grid gap-3">
        {goals.map((goal, i) => {
          const pct = Math.min(
            100,
            Math.round((goal.currentAmount / goal.targetAmount) * 100)
          );
          const remaining = goal.targetAmount - goal.currentAmount;
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
            >
              <Card className="group p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-medium text-ink-900">
                      {goal.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-400">
                      {goal.deadline
                        ? `Target ${format(new Date(goal.deadline), "MMM yyyy")}`
                        : "No deadline"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-brand-700">
                      {pct}%
                    </span>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={deleting === goal.id}
                      className="pressable flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-all hover:bg-warning-50 hover:text-warning-700 md:opacity-0 md:group-hover:opacity-100"
                    >
                      {deleting === goal.id ? (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Trash2 size={14} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-brand-100"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.name} progress`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.1 + i * 0.05,
                      ease: EASE,
                    }}
                    className="h-full rounded-full bg-brand-600"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-hair border-line pt-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-ink-400">
                      Saved
                    </p>
                    <Money value={goal.currentAmount} tone="positive" className="text-[14px]" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-ink-400">
                      Remaining
                    </p>
                    <Money value={remaining} className="text-[14px]" />
                  </div>
                </div>

                {showContribute === goal.id ? (
                  <div className="mt-3 flex items-end gap-2 border-t border-hair border-line pt-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={getState(goal.id).amount}
                        onChange={(e) => setField(goal.id, "amount", e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-md border border-hair border-line px-2.5 py-1.5 text-right font-mono text-[12px] text-ink-900 focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        From
                      </label>
                      <select
                        value={getState(goal.id).account}
                        onChange={(e) => setField(goal.id, "account", e.target.value)}
                        className="w-full rounded-md border border-hair border-line px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-600 focus:outline-none"
                      >
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleContribute(goal.id)}
                      disabled={contributing === goal.id || !getState(goal.id).amount || !getState(goal.id).account}
                      className="pressable flex h-[34px] shrink-0 items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 text-[12px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {contributing === goal.id ? (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        "Add"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowContribute(null);
                        setContribState((prev) => {
                          const next = { ...prev };
                          delete next[goal.id];
                          return next;
                        });
                      }}
                      className="pressable flex h-[34px] items-center justify-center rounded-lg border border-hair border-line px-2.5 text-[12px] text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-end border-t border-hair border-line pt-3">
                    <button
                      onClick={() => setShowContribute(goal.id)}
                      className="pressable rounded-lg bg-brand-600 px-3.5 py-1.5 text-[12px] font-medium text-paper-0 transition-colors hover:bg-brand-700"
                    >
                      + Contribute
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}
