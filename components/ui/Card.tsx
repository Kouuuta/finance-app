"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={`rounded-card border border-hair border-line bg-paper-0 ${className}`}
    >
      {children}
    </Tag>
  );
}

interface MetricProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function Metric({ label, children, className = "" }: MetricProps) {
  return (
    <div className={className}>
      <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <div className="mt-1 text-ink-900">{children}</div>
    </div>
  );
}
