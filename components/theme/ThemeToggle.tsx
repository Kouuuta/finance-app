"use client";

import { motion } from "framer-motion";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={`pressable relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-lg border border-hair border-line bg-paper-0 text-ink-700 transition-colors duration-200 ease-out hover:border-brand-500 hover:text-brand-700 ${
        compact ? "h-11 w-11" : "gap-2 px-3"
      }`}
    >
      <motion.span
        initial={false}
        animate={{ rotate: isDark ? -18 : 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
        className="flex items-center justify-center"
      >
        {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      </motion.span>
      {!compact && (
        <span className="text-[13px] font-medium">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
