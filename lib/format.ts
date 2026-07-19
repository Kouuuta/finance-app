const CURRENCY_CONFIG: Record<string, { locale: string; symbol: string }> = {
  PHP: { locale: "en-PH", symbol: "\u20B1" },
  USD: { locale: "en-US", symbol: "$" },
  EUR: { locale: "de-DE", symbol: "\u20AC" },
  GBP: { locale: "en-GB", symbol: "\u00A3" },
  JPY: { locale: "ja-JP", symbol: "\u00A5" },
  CAD: { locale: "en-CA", symbol: "CA$" },
  AUD: { locale: "en-AU", symbol: "AU$" },
  SGD: { locale: "en-SG", symbol: "S$" },
  HKD: { locale: "en-HK", symbol: "HK$" },
  CNY: { locale: "zh-CN", symbol: "CN\u00A5" },
  KRW: { locale: "ko-KR", symbol: "\u20A9" },
  INR: { locale: "en-IN", symbol: "\u20B9" },
  IDR: { locale: "id-ID", symbol: "Rp" },
  MYR: { locale: "ms-MY", symbol: "RM" },
  THB: { locale: "th-TH", symbol: "\u0E3F" },
  VND: { locale: "vi-VN", symbol: "\u20AB" },
};

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const cached = formatters.get(currency);
  if (cached) return cached;

  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.PHP!;
  const fmt = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
  });
  formatters.set(currency, fmt);
  return fmt;
}

function symbol(currency: string): string {
  return CURRENCY_CONFIG[currency]?.symbol ?? CURRENCY_CONFIG.PHP!.symbol;
}

export function formatMoney(value: number, currency = "PHP"): string {
  return `${symbol(currency)}${getFormatter(currency).format(Math.abs(value))}`;
}

export function formatSigned(value: number, currency = "PHP"): string {
  const sign = value < 0 ? "\u2212" : "+";
  return `${sign} ${symbol(currency)}${getFormatter(currency).format(Math.abs(value))}`;
}

export function formatCompact(value: number, currency = "PHP"): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${symbol(currency)}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${symbol(currency)}${(value / 1000).toFixed(1)}k`;
  }
  return formatMoney(value, currency);
}

export function formatPercent(value: number): string {
  const sign = value < 0 ? "\u2212" : "+";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}
