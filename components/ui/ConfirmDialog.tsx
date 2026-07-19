"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangleIcon } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isLoading = false,
}: ConfirmDialogProps) {
  const trapRef = useFocusTrap(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px] sm:items-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            ref={trapRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.12 }}
            className="w-full max-w-sm rounded-t-2xl border border-hair border-line bg-paper-0 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-hair border-line px-6 py-4">
              <div className="h-8 w-1 shrink-0 rounded-full bg-warning-600" />
              <div className="flex-1">
                <h2 id="confirm-dialog-title" className="text-[16px] font-medium text-ink-900">{title}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="pressable flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-700">
                  <AlertTriangleIcon size={20} strokeWidth={1.75} />
                </div>
                <p className="pt-1 text-[14px] text-ink-600">{message}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="pressable flex flex-1 items-center justify-center rounded-full border border-hair border-line py-2.5 text-[14px] font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="pressable flex flex-1 items-center justify-center rounded-full bg-warning-600 py-2.5 text-[14px] font-medium text-paper-0 transition-colors hover:bg-warning-700 disabled:opacity-50"
                >
                  {isLoading ? "Deleting…" : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
