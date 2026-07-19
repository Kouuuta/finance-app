"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeading } from "@/components/layout/PageHeading";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { InstitutionIcon } from "@/components/ui/InstitutionIcon";
import { AddButton } from "@/components/ui/AddButton";
import { AccountForm } from "@/components/forms/account-form";
import { Trash2, PencilIcon } from "lucide-react";
import { offlineAction } from "@/lib/offline";
import { useState } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  exchangeRateToBase?: number;
  interestRateAnnual?: number | null;
  institutionId?: string | null;
  institution?: { id: string; name: string; logoUrl?: string | null } | null;
}

interface Institution {
  id: string;
  name: string;
  type: string;
  icon: string;
  logoUrl?: string | null;
}

interface AccountsContentProps {
  accounts: Account[];
  institutions: Institution[];
}

const TYPE_LABEL: Record<string, string> = {
  ewallet: "E-wallet",
  bank: "Bank",
  savings: "Savings",
  bnpl: "Buy now, pay later",
  cash: "Cash",
  other: "Other",
};

export function AccountsContent({ accounts, institutions }: AccountsContentProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const spending = accounts.filter((a) => a.type !== "bnpl");
  const owed = accounts.filter((a) => a.type === "bnpl");
  const netWorth = accounts.reduce(
    (s, a) => {
      const baseBalance = a.balance * (a.exchangeRateToBase ?? 1);
      return s + (a.type === "bnpl" ? -baseBalance : baseBalance);
    },
    0
  );

  const deleteAccount = offlineAction("deleteAccount");

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteAccount(id);
    setDeleting(null);
  }

  function LogoBlock({ account }: { account: Account }) {
    const logoUrl = account.institution?.logoUrl ?? null;
    return (
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl border border-hair ${
          account.type === "bnpl"
            ? "border-warning-600/20 bg-warning-50 text-warning-700"
            : "border-brand-500/20 bg-brand-50 text-brand-700"
        }`}
      >
        <InstitutionIcon
          type={account.type}
          logoUrl={logoUrl}
          institutionName={account.name}
          className="h-9 w-9 object-contain"
        />
      </div>
    );
  }

  function AccountCard({ account, index }: { account: Account; index: number }) {
    const isOwed = account.type === "bnpl";

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.32, delay: index * 0.03, ease: EASE }}
        className={`relative rounded-card border border-hair p-5 transition-colors duration-150 ${
          isOwed
            ? "border-warning-600/20 bg-warning-50"
            : "border-line bg-paper-0"
        }`}
      >
        <div className="absolute right-1 top-1 flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(account); }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isOwed
                ? "text-warning-700 hover:bg-warning-100"
                : "text-ink-400 hover:bg-brand-50 hover:text-brand-700"
            }`}
            aria-label={`Edit ${account.name}`}
          >
            <PencilIcon size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => handleDelete(account.id)}
            disabled={deleting === account.id}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isOwed
                ? "text-warning-700 hover:bg-warning-100"
                : "text-ink-400 hover:bg-brand-50 hover:text-brand-700"
            }`}
            aria-label={`Delete ${account.name}`}
          >
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        </div>

        <LogoBlock account={account} />

        <p className="mt-3 truncate pr-5 text-[14px] font-medium text-ink-900">
          {account.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink-400">
          {TYPE_LABEL[account.type]}
        </p>
        <p
          className={`mt-2 font-mono text-[16px] ${isOwed ? "text-warning-700" : "text-ink-900"}`}
        >
          {isOwed ? "\u2212 " : ""}
          <Money value={account.balance} currency={account.currency ?? "PHP"} />
        </p>
        {isOwed && (
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-warning-700">
            Outstanding
          </p>
        )}
        {account.type === "savings" && account.interestRateAnnual && (
          <p className="mt-1.5 font-mono text-[12px] text-positive-700">
            {account.interestRateAnnual}% p.a. · +{" "}
            <Money
              value={
                Math.round(
                  ((account.balance * account.interestRateAnnual) / 100 / 365) *
                    100
                ) / 100
              }
              currency={account.currency ?? "PHP"}
            />{" "}
            / day
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Balances"
        title="Accounts"
        action={<AddButton label="Add" onClick={() => setShowForm(true)} />}
      />

      <AccountForm
        open={showForm || !!editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        institutions={institutions}
        existingAccounts={accounts}
        editAccount={editing}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="mb-8"
      >
        <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-700">
          Available across accounts
        </p>
        <p className="mt-2 font-display text-[36px] font-medium leading-none text-ink-900 sm:text-[42px]">
          {netWorth < 0 ? "\u2212 " : ""}
          <Money value={Math.abs(netWorth)} />
        </p>
      </motion.div>

      {spending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-brand-700">
            Spending & savings
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {spending.map((account, i) => (
              <AccountCard key={account.id} account={account} index={i} />
            ))}
          </div>
        </section>
      )}

      {owed.length > 0 && (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-brand-700">
            Owed (nets against total)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {owed.map((account, i) => (
              <AccountCard key={account.id} account={account} index={i} />
            ))}
          </div>
        </section>
      )}

      {accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="rounded-card border border-hair border-line bg-paper-0 px-6 py-14 text-center"
        >
          <p className="text-[15px] font-medium text-ink-900">
            No accounts yet
          </p>
          <p className="mt-1 text-[13px] text-ink-400">
            Add your first account to start tracking your finances.
          </p>
        </motion.div>
      )}
    </div>
  );
}
