"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;
const TYPE_SPEED_MS = 150;
const HOLD_MS = 550;
const BAR_FILL_MS = 2000;

interface LoadingScreenProps {
  /** Word that types out — defaults to the app name */
  word?: string;
  tagline?: string;
  /** Fires once the full sequence has played, so callers can redirect */
  onComplete?: () => void;
}

export function LoadingScreen({
  word = "Vault",
  tagline = "Setting up your ledger",
  onComplete,
}: LoadingScreenProps) {
  const [typed, setTyped] = useState("");
  const [showTagline, setShowTagline] = useState(false);
  const [barFilled, setBarFilled] = useState(false);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      const t = setTimeout(() => {
        setTyped(word);
        setShowTagline(true);
        setBarFilled(true);
        onComplete?.();
      }, 0);
      return () => clearTimeout(t);
    }

    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function typeNext() {
      i += 1;
      setTyped(word.slice(0, i));
      if (i < word.length) {
        timers.push(setTimeout(typeNext, TYPE_SPEED_MS));
      } else {
        timers.push(
          setTimeout(() => {
            setShowTagline(true);
            setBarFilled(true);
          }, HOLD_MS)
        );
        timers.push(
          setTimeout(() => onComplete?.(), HOLD_MS + BAR_FILL_MS)
        );
      }
    }

    timers.push(setTimeout(typeNext, TYPE_SPEED_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#12120F]"
      role="status"
      aria-live="polite"
      aria-label="Setting up your account"
    >
      <div className="text-center">
        <p className="font-display text-[38px] font-medium leading-none text-[#FAF9F6]">
          {typed}
          <span
            className="loading-cursor ml-[3px] inline-block h-[34px] w-[2px] align-[-6px] bg-[#FAF9F6]"
            aria-hidden="true"
          />
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: showTagline ? 1 : 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-3.5 font-sans text-[12px] text-[#7A7A72]"
        >
          {tagline}
        </motion.p>
      </div>

      <div className="absolute bottom-14 h-[2px] w-[110px] overflow-hidden rounded-full bg-[#2A2A25]">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: barFilled ? "100%" : "0%" }}
          transition={{ duration: BAR_FILL_MS / 1000, ease: EASE }}
          className="h-full bg-[#FAF9F6]"
        />
      </div>
    </motion.div>
  );
}
