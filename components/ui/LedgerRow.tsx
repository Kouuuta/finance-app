"use client";

import { motion } from "framer-motion";

interface LedgerRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  amount: React.ReactNode;
  amountMeta?: React.ReactNode;
  action?: React.ReactNode;
  index?: number;
  onClick?: () => void;
}

export function LedgerRow({
  title,
  subtitle,
  leading,
  amount,
  amountMeta,
  action,
  index = 0,
  onClick,
}: LedgerRowProps) {
  const interactive = Boolean(onClick);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.04, 0.32),
        ease: [0.23, 1, 0.32, 1],
      }}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`flex items-center justify-between gap-3 border-t border-hair border-line py-3 first:border-t-0 ${
        interactive
          ? "-mx-2 cursor-pointer rounded-md px-2 transition-colors duration-150 ease-out hover:bg-brand-50"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hair border-line bg-paper-0 text-ink-700">
            {leading}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium leading-tight text-ink-900">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-[12px] leading-tight text-ink-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[15px] leading-tight text-ink-900">{amount}</div>
        {amountMeta && (
          <div className="mt-0.5 text-[11px] leading-tight text-ink-400">
            {amountMeta}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
