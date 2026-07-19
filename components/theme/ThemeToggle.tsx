"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import type { ThemePreference } from "./ThemeProvider";

interface ThemeToggleProps {
  compact?: boolean;
}

const CYCLE: ThemePreference[] = ["light", "dark", "system"];

const CONFIG: Record<ThemePreference, { icon: typeof SunIcon; label: string; compactLabel: string }> = {
  light: { icon: SunIcon, label: "Light", compactLabel: "Light" },
  dark: { icon: MoonIcon, label: "Dark", compactLabel: "Dark" },
  system: { icon: MonitorIcon, label: "System", compactLabel: "Auto" },
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();
  const cfg = CONFIG[preference];
  const Icon = cfg.icon;

  function cycle() {
    const idx = CYCLE.indexOf(preference);
    setPreference(CYCLE[(idx + 1) % CYCLE.length]);
  }

  return (
    <button
      type="button"
      aria-label={`Theme: ${cfg.label}`}
      title={`Theme: ${cfg.label}`}
      onClick={cycle}
      className={`pressable relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-lg border border-hair border-line bg-paper-0 text-ink-700 transition-colors duration-200 ease-out hover:border-brand-500 hover:text-brand-700 ${
        compact ? "h-11 w-11" : "gap-2 px-3"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={preference}
          initial={{ rotate: -18, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 18, opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
          className="flex items-center justify-center"
        >
          <Icon size={18} />
        </motion.span>
      </AnimatePresence>
      {!compact && (
        <span className="text-[13px] font-medium">{cfg.label}</span>
      )}
    </button>
  );
}
