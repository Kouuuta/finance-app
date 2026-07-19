"use client";

import { PlusIcon } from "lucide-react";

interface AddButtonProps {
  label: string;
  onClick?: () => void;
}

export function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-paper-0 transition-colors duration-150 ease-out hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <PlusIcon size={18} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}
