"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckIcon, PencilIcon } from "lucide-react";
import { InstitutionIcon } from "@/components/ui/InstitutionIcon";

interface Institution {
  id: string;
  name: string;
  type: string;
  icon: string;
  logoUrl?: string | null;
}

interface ExistingAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  institutionId?: string | null;
  institution?: { id: string; name: string; logoUrl?: string | null } | null;
}

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  institutions: Institution[];
  existingAccounts?: ExistingAccount[];
}

const TYPE_OPTIONS = [
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-wallet" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "bnpl", label: "Buy now, pay later" },
  { value: "other", label: "Other" },
];

const FILTER_MAP: Record<string, string[]> = {
  bank: ["bank"],
  ewallet: ["ewallet"],
  savings: ["bank", "ewallet"],
  cash: ["cash"],
  bnpl: ["bnpl"],
  other: ["other"],
};

const TYPE_LABEL: Record<string, string> = {
  ewallet: "E-wallet",
  bank: "Bank",
  savings: "Savings",
  bnpl: "Buy now, pay later",
  cash: "Cash",
  other: "Other",
};

export function AccountForm({ open, onClose, institutions, existingAccounts = [] }: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [institutionId, setInstitutionId] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRateAnnual, setInterestRateAnnual] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = existingAccounts.filter((a) => a.type === type);

  function pickInst(inst: Institution) {
    if (institutionId === inst.id) {
      setInstitutionId("");
      return;
    }
    setError(null);
    setInstitutionId(inst.id);
    setName(inst.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { createAccount } = await import("@/lib/actions/accounts");
      await createAccount({
        name,
        type,
        institutionId: institutionId || undefined,
        balance: parseFloat(balance) || 0,
        interestRateAnnual:
          type === "savings" && interestRateAnnual
            ? parseFloat(interestRateAnnual)
            : undefined,
      });
      onClose();
      setName("");
      setType("bank");
      setInstitutionId("");
      setBalance("");
      setInterestRateAnnual("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateBalance(id: string, newBalance: number) {
    setUpdating(id);
    setError(null);
    try {
      const { updateAccount } = await import("@/lib/actions/accounts");
      await updateAccount(id, { balance: newBalance });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update balance");
    } finally {
      setUpdating(null);
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
            className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl border border-hair border-line bg-paper-0 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-hair border-line">
              <div className="flex items-center gap-3 px-6 pt-4">
                <div className="h-8 w-1 shrink-0 rounded-full bg-brand-600" />
                <div className="flex-1">
                  <h2 className="text-[16px] font-medium text-ink-900">
                    Manage accounts
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 px-6 pb-4">
                {TYPE_OPTIONS.map((opt) => {
                  const active = type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setType(opt.value);
                        setInstitutionId("");
                      }}
                      className={`pressable rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        active
                          ? "border-brand-600 bg-brand-600 text-paper-0"
                          : "border-line text-ink-700 hover:border-brand-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto px-6 pb-6 pt-4">
              {existing.length > 0 && (
                <div className="mb-5 space-y-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                    Your {TYPE_LABEL[type] ?? type} accounts
                  </p>
                  {existing.map((acc) => {
                    const logoUrl = acc.institution?.logoUrl ?? null;
                    return (
                      <ExistingRow
                        key={acc.id}
                        account={acc}
                        logoUrl={logoUrl}
                        updating={updating === acc.id}
                        onUpdate={(bal) =>
                          handleUpdateBalance(acc.id, bal)
                        }
                      />
                    );
                  })}
                </div>
              )}

              <div>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                  Add new
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {institutions.filter((inst) => (FILTER_MAP[type] ?? []).includes(inst.type)).map((inst) => {
                      const active = institutionId === inst.id;
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => pickInst(inst)}
                          className={`pressable relative flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                            active
                              ? "border-brand-600 bg-brand-50"
                              : "border-line bg-paper-0 hover:border-brand-500"
                          }`}
                        >
                          {active && (
                            <span className="absolute right-1 top-1 text-brand-600">
                              <CheckIcon size={12} strokeWidth={3} />
                            </span>
                          )}
                          <InstitutionIcon
                            type={inst.type}
                            logoUrl={inst.logoUrl}
                            institutionName={inst.name}
                            className="h-8 w-8 object-contain"
                          />
                          <span className="text-[10px] font-medium text-ink-700 leading-tight text-center">
                            {inst.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {institutionId && (
                    <>
                      <div>
                        <label className="mb-1 block text-[13px] font-medium text-ink-700">
                          Name
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
                          placeholder={`${institutions.find((i) => i.id === institutionId)?.name ?? ""} ${TYPE_LABEL[type] ?? type}`}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[13px] font-medium text-ink-700">
                          Balance
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={balance}
                          onChange={(e) => setBalance(e.target.value)}
                          className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      {type === "savings" && (
                        <div>
                          <label className="mb-1 block text-[13px] font-medium text-ink-700">
                            Interest rate (% p.a.)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={interestRateAnnual}
                            onChange={(e) =>
                              setInterestRateAnnual(e.target.value)
                            }
                            className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
                            placeholder="3.5"
                          />
                        </div>
                      )}

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
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        )}
                        {submitting ? "Adding…" : "Add account"}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExistingRow({
  account,
  logoUrl,
  updating,
  onUpdate,
}: {
  account: ExistingAccount;
  logoUrl: string | null;
  updating: boolean;
  onUpdate: (balance: number) => Promise<void>;
}) {
  const [val, setVal] = useState(String(account.balance));

  return (
    <div className="flex items-center gap-3 rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-50 text-brand-700">
        <InstitutionIcon
          type={account.type}
          logoUrl={logoUrl}
          institutionName={account.name}
          className="h-6 w-6 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink-900">
          {account.name}
        </p>
        <p className="text-[11px] text-ink-400">
          {TYPE_LABEL[account.type]}
        </p>
      </div>
      <input
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onUpdate(parseFloat(val) || 0);
        }}
        className="w-24 shrink-0 rounded-md border border-hair border-line px-2.5 py-1.5 text-right font-mono text-[13px] text-ink-900 focus:border-brand-600 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onUpdate(parseFloat(val) || 0)}
        disabled={updating}
        className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
      >
        {updating ? (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <PencilIcon size={15} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
