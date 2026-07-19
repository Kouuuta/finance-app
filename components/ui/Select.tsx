"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckIcon } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

const ease = [0.23, 1, 0.32, 1] as const;

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  buttonClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) {
      setFocusIdx(-1);
      return;
    }
    const idx = options.findIndex((o) => o.value === value);
    setFocusIdx(idx >= 0 ? idx : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function select(idx: number) {
    if (idx >= 0 && idx < options.length) {
      onChange(options[idx].value);
    }
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusIdx((prev) => Math.min(prev + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIdx((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        select(focusIdx);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  useEffect(() => {
    if (!open || focusIdx < 0 || !listRef.current) return;
    const el = listRef.current.children[focusIdx] as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [focusIdx, open]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`pressable flex w-full items-center justify-between gap-2 border border-hair border-line bg-paper-0 text-left transition-colors duration-150 focus:border-brand-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${buttonClassName ?? "rounded-lg px-3.5 py-2.5 text-[15px]"}`}
      >
        <span
          className={`truncate ${selected ? "text-ink-900" : "text-ink-400"}`}
        >
          {selected?.label ?? placeholder ?? "Select\u2026"}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease }}
          className="shrink-0 text-ink-400"
        >
          <ChevronDown size={16} strokeWidth={1.75} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18, ease }}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-line bg-paper-0 py-1 shadow-lg"
          >
            {options.length === 0 ? (
              <div className="px-3.5 py-2 text-[13px] text-ink-400">
                No options
              </div>
            ) : (
              options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isFocused = i === focusIdx;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => select(i)}
                    onMouseEnter={() => setFocusIdx(i)}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[14px] transition-colors duration-75 ${
                      isSelected
                        ? "text-brand-700 font-medium"
                        : isFocused
                          ? "bg-brand-50 text-ink-900"
                          : "text-ink-900 hover:bg-brand-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <CheckIcon
                        size={14}
                        strokeWidth={2.5}
                        className="shrink-0 text-brand-600"
                      />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
