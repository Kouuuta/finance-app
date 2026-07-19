"use client";

import { motion } from "framer-motion";

interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}

export function PageHeading({ eyebrow, title, action }: PageHeadingProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="mb-6 flex items-end justify-between gap-4"
    >
      <div>
        {eyebrow && (
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-brand-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[26px] font-medium leading-none text-ink-900 sm:text-[30px]">
          {title}
        </h1>
      </div>
      {action}
    </motion.header>
  );
}
