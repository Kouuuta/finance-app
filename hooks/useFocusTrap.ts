"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocusTrap(open: boolean, onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    prev.current = document.activeElement;

    const el = ref.current;
    if (!el) return;

    const focusables = () => el.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = () => focusables()[0];
    const last = () => focusables()[focusables().length - 1];

    first()?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1]?.focus();
        }
      } else {
        if (document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0]?.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (prev.current instanceof HTMLElement) prev.current.focus();
    };
  }, [open, onClose]);

  return ref;
}
