"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ensureUser } from "@/lib/actions/auth";

const EASE = [0.23, 1, 0.32, 1] as const;

const item = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: EASE },
});

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    if (data.user) {
      await ensureUser(data.user.id, data.user.email!, name || undefined);
    }

    setSubmitting(false);
    router.push("/login?message=Check your email to confirm your account");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-full max-w-sm"
    >
      <div className="rounded-card border border-hair border-line bg-paper-0 px-8 py-10">
        <motion.div {...item(0)}>
          <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-400">
            Finance Tracker
          </div>
          <h1 className="font-display text-[28px] font-medium text-ink-900">
            Create account
          </h1>
          <p className="mt-1 text-[13px] text-ink-400">
            Track your finances, your way.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <motion.div {...item(0.04)}>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[13px] font-medium text-ink-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
              className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
            />
          </motion.div>

          <motion.div {...item(0.08)}>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-ink-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
            />
          </motion.div>

          <motion.div {...item(0.12)}>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-ink-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700"
            >
              {error}
            </motion.p>
          )}

          <motion.div {...item(0.16)}>
            <button
              type="submit"
              disabled={submitting}
              className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-[15px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {submitting ? "Creating…" : "Create account"}
            </button>
          </motion.div>
        </form>

        <motion.p
          {...item(0.2)}
          className="mt-6 text-center text-[13px] text-ink-400"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-700 transition-colors hover:text-brand-600"
          >
            Sign in
          </Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
