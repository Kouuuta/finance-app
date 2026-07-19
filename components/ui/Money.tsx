"use client";

import { formatMoney, formatSigned } from "../../lib/format";

type MoneyTone = "neutral" | "positive" | "warning" | "brand";

interface MoneyProps {
  value: number;
  signed?: boolean;
  tone?: MoneyTone;
  className?: string;
}

const TONE_CLASS: Record<MoneyTone, string> = {
  neutral: "",
  positive: "text-positive-700",
  warning: "text-warning-700",
  brand: "text-brand-700",
};

export function Money({
  value,
  signed = false,
  tone = "neutral",
  className = "",
}: MoneyProps) {
  const text = signed ? formatSigned(value) : formatMoney(value);
  return (
    <span
      className={`font-mono tabular-nums ${TONE_CLASS[tone]} ${className}`}
    >
      {text}
    </span>
  );
}
