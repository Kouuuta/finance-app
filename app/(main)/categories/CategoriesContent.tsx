"use client";

import { motion } from "framer-motion";
import { TagIcon, PencilIcon, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { AddButton } from "@/components/ui/AddButton";
import { CategoryForm } from "@/components/forms/category-form";
import { offlineAction } from "@/lib/offline";
import { useState } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Category {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
}

interface CategoriesContentProps {
  categories: Category[];
}

const TYPE_LABEL: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  income: { bg: "bg-positive-50", text: "text-positive-700" },
  expense: { bg: "bg-warning-50", text: "text-warning-700" },
  transfer: { bg: "bg-brand-50", text: "text-brand-700" },
};

export function CategoriesContent({ categories }: CategoriesContentProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = categories.reduce(
    (acc, cat) => {
      const key = cat.type === "transfer" ? "transfer" : cat.type === "income" ? "income" : "expense";
      if (!acc[key]) acc[key] = [];
      acc[key].push(cat);
      return acc;
    },
    {} as Record<string, Category[]>
  );

  const deleteCategory = offlineAction("deleteCategory");

  async function handleDelete(id: string) {
    setDeleting(id);
    setError(null);
    try {
      await deleteCategory(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(null);
    }
    setDeleting(null);
  }

  return (
    <div>
      <PageHeading
        eyebrow="Classification"
        title="Categories"
        action={<AddButton label="Add" onClick={() => setShowForm(true)} />}
      />

      <CategoryForm
        open={showForm || !!editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editCategory={editing}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg bg-warning-50 px-4 py-3 text-[13px] text-warning-700"
        >
          {error}
        </motion.div>
      )}

      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="rounded-card border border-hair border-line bg-paper-0 px-6 py-14 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
            <TagIcon size={22} className="text-brand-600" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-medium text-ink-900">No categories yet</p>
          <p className="mt-1 text-[13px] text-ink-400">
            Create categories to organise your transactions.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {(["expense", "income", "transfer"] as const).map((type) => {
            const items = grouped[type];
            if (!items?.length) return null;

            const colors = TYPE_COLORS[type];

            return (
              <section key={type}>
                <h2
                  className={`mb-3 text-[13px] font-semibold uppercase tracking-wide ${colors.text}`}
                >
                  {TYPE_LABEL[type] ?? type}
                </h2>
                <div className="space-y-1.5">
                  {items.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.28,
                        delay: i * 0.02,
                        ease: EASE,
                      }}
                      className="flex items-center gap-3 rounded-lg border border-hair border-line bg-paper-0 px-4 py-3"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
                      >
                        <TagIcon
                          size={15}
                          className={colors.text}
                          strokeWidth={1.5}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-ink-900">
                          {cat.name}
                        </p>
                        {cat.isDefault && (
                          <span className="mt-0.5 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                            Default
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setEditing(cat)}
                        className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <PencilIcon size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleting === cat.id}
                        className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-warning-50 hover:text-warning-700 disabled:opacity-40"
                        aria-label={`Delete ${cat.name}`}
                      >
                        {deleting === cat.id ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Trash2 size={15} strokeWidth={1.5} />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
