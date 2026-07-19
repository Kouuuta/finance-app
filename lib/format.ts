// Currency + number formatting helpers (PHP peso, monochrome ledger style).

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return `\u20B1${pesoFormatter.format(Math.abs(value))}`;
}

export function formatSigned(value: number): string {
  const sign = value < 0 ? "\u2212" : "+";
  return `${sign} \u20B1${pesoFormatter.format(Math.abs(value))}`;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `\u20B1${(value / 1000).toFixed(1)}k`;
  }
  return formatMoney(value);
}

export function formatPercent(value: number): string {
  const sign = value < 0 ? "\u2212" : "+";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}
