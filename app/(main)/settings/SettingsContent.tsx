"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SunIcon, MoonIcon, MonitorIcon, LogOutIcon, Loader2Icon } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { useTheme } from "@/components/theme/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions/auth";

const ease = [0.23, 1, 0.32, 1] as const;

const THEMES = [
  {
    id: "light" as const,
    label: "Light",
    desc: "Clean, bright interface",
    icon: SunIcon,
  },
  {
    id: "dark" as const,
    label: "Dark",
    desc: "Easy on the eyes",
    icon: MoonIcon,
  },
  {
    id: "system" as const,
    label: "System",
    desc: "Follows your device",
    icon: MonitorIcon,
  },
] as const;

export default function SettingsContent({
  userId,
  name: initialName,
  email,
}: {
  userId: string;
  name: string | null;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { preference, setPreference } = useTheme();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateProfile(userId, { name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const hasChanged = name !== (initialName ?? "");

  return (
    <>
      <PageHeading title="Settings" eyebrow="Preferences" />

      <div className="space-y-6">
        {/* Profile card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease, delay: 0.04 }}
          className="rounded-card border border-hair border-line bg-paper-0 p-6"
        >
          <h2 className="mb-4 font-display text-[18px] font-medium text-ink-900">
            Profile
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-ink-500"
              >
                Email
              </label>
              <input
                id="email"
                type="text"
                value={email}
                disabled
                className="w-full rounded-lg border border-hair border-line bg-paper-100 px-3.5 py-2.5 text-[15px] text-ink-500"
              />
            </div>

            <div>
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
                placeholder="Your name"
                className="w-full rounded-lg border border-hair border-line bg-paper-0 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !hasChanged}
                className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-[14px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:opacity-40"
              >
                {saving && <Loader2Icon size={15} className="animate-spin" />}
                {saving ? "Saving…" : "Save"}
              </button>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[13px] font-medium text-positive-600"
                >
                  Saved
                </motion.span>
              )}
            </div>
          </form>
        </motion.section>

        {/* Theme card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease, delay: 0.08 }}
          className="rounded-card border border-hair border-line bg-paper-0 p-6"
        >
          <h2 className="mb-4 font-display text-[18px] font-medium text-ink-900">
            Theme
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const isActive = preference === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPreference(t.id)}
                  className={`pressable relative flex flex-col items-center gap-2 rounded-xl border px-4 py-5 text-center transition-colors duration-200 ${
                    isActive
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-hair border-line bg-paper-0 text-ink-500 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  <Icon
                    size={24}
                    className={isActive ? "text-brand-600" : "text-ink-400"}
                  />
                  <span className="text-[14px] font-medium">{t.label}</span>
                  <span className="text-[12px] leading-tight text-ink-400">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Sign out card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease, delay: 0.12 }}
          className="rounded-card border border-hair border-warning-200 bg-paper-0 p-6"
        >
          <h2 className="mb-2 font-display text-[18px] font-medium text-ink-900">
            Sign out
          </h2>
          <p className="mb-4 text-[14px] text-ink-400">
            You will be redirected to the login page.
          </p>
          <button
            type="button"
            onClick={() => setShowSignOut(true)}
            className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-warning-600 px-5 text-[14px] font-medium text-paper-0 transition-colors hover:bg-warning-700"
          >
            <LogOutIcon size={15} />
            Sign out
          </button>
        </motion.section>
      </div>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showSignOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-sm"
            onClick={() => setShowSignOut(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-card border border-hair border-line bg-paper-0 p-6 shadow-lg"
            >
              <h3 className="font-display text-[20px] font-medium text-ink-900">
                Sign out
              </h3>
              <p className="mt-2 text-[14px] text-ink-400">
                Are you sure you want to sign out?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignOut(false)}
                  disabled={signingOut}
                  className="pressable inline-flex h-10 items-center rounded-full border border-hair border-line bg-paper-0 px-5 text-[14px] font-medium text-ink-700 transition-colors hover:bg-paper-50 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-warning-600 px-5 text-[14px] font-medium text-paper-0 transition-colors hover:bg-warning-700 disabled:opacity-40"
                >
                  {signingOut && (
                    <Loader2Icon size={15} className="animate-spin" />
                  )}
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
