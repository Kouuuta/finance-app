"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  WalletIcon,
  ListIcon,
  TagIcon,
  TargetIcon,
  LineChartIcon,
  SettingsIcon,
  RepeatIcon,
  MoreHorizontalIcon,
  CircleDollarSignIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { PwaRegister } from "../PwaRegister";
import { OfflineBanner } from "../OfflineBanner";

interface NavItem {
  to: string;
  label: string;
  icon: typeof HomeIcon;
}

const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/accounts", label: "Accounts", icon: WalletIcon },
  { to: "/transactions", label: "Ledger", icon: ListIcon },
  { to: "/autopay", label: "Autopay", icon: RepeatIcon },
];

const MORE_NAV: NavItem[] = [
  { to: "/categories", label: "Categories", icon: TagIcon },
  { to: "/goals", label: "Goals", icon: TargetIcon },
  { to: "/budget", label: "Budget", icon: CircleDollarSignIcon },
  { to: "/investments", label: "Invest", icon: LineChartIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...MORE_NAV];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-paper-50 text-ink-900">
      <PwaRegister />
      <OfflineBanner />
      <DesktopRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-28 pt-24 sm:px-6 md:pb-12 md:pt-10">
          {children}
        </main>
      </div>
      <div className="fixed inset-x-0 top-0 z-20 h-18 border-b border-hair border-line bg-paper-50/90 backdrop-blur-sm md:hidden" />
      <div className="fixed inset-x-0 top-5 z-30 flex items-center justify-center md:hidden pointer-events-none">
        <span className="font-display text-[17px] font-semibold tracking-tight text-ink-900">Vault</span>
      </div>
      <div className="fixed left-5 top-5 z-30 md:hidden">
        <Link
          href="/settings"
          aria-label="Settings"
          className="pressable flex h-11 w-11 items-center justify-center rounded-lg border border-hair border-line bg-paper-0 text-ink-700 transition-colors duration-200 ease-out hover:border-brand-500 hover:text-brand-700"
        >
          <SettingsIcon size={18} strokeWidth={1.75} />
        </Link>
      </div>
      <div className="fixed right-5 top-5 z-30 md:hidden">
        <ThemeToggle compact />
      </div>
      <BottomNav />
    </div>
  );
}

function DesktopRail() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center border-r border-hair border-line bg-paper-0 py-6 md:flex"
    >
      <span className="mb-8 flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 font-display text-[18px] leading-none text-paper-0">
        V
      </span>
      <ul className="flex flex-col items-center gap-1">
        {ALL_NAV.map((item) => (
          <li key={item.to}>
            <RailLink item={item} />
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col items-center gap-1">
        <ThemeToggle compact />
      </div>
    </nav>
  );
}

function RailLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Link
      href={item.to}
      aria-label={item.label}
      className="group relative flex h-11 w-11 items-center justify-center rounded-lg text-ink-400 transition-colors duration-150 ease-out hover:text-brand-700"
    >
      {isActive && (
        <motion.span
          layoutId="rail-active"
          transition={{
            type: "spring",
            duration: 0.4,
            bounce: 0.15,
          }}
          className="absolute inset-0 rounded-lg bg-brand-100"
        />
      )}
      <Icon
        className={`relative h-[22px] w-[22px] ${isActive ? "text-brand-700" : ""}`}
        strokeWidth={isActive ? 2 : 1.75}
      />
      <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[12px] font-medium text-paper-0 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 lg:block">
        {item.label}
      </span>
    </Link>
  );
}

function MoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    if (!el) return;
    const focusables = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    focusables[0]?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={menuRef}
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
            className="fixed bottom-24 left-1/2 z-50 w-[220px] -translate-x-1/2 rounded-2xl border border-hair border-line bg-paper-0 p-1.5 shadow-xl md:hidden"
          >
            {MORE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  role="menuitem"
                  onClick={onClose}
                  className={`pressable flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.75}
                    className={isActive ? "text-brand-700" : "text-ink-400"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MORE_NAV.some(
    (item) => item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)
  );

  return (
    <>
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hair border-line bg-paper-0/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  href={item.to}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className="pressable relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-2"
                >
                  <span className="relative flex h-6 w-full items-center justify-center">
                    {isActive && (
                      <motion.span
                        layoutId="tab-active"
                        transition={{
                          type: "spring",
                          duration: 0.4,
                          bounce: 0.15,
                        }}
                        className="absolute -top-2 h-1 w-6 rounded-full bg-brand-600"
                      />
                    )}
                    <Icon
                      className={isActive ? "text-brand-700" : "text-ink-400"}
                      strokeWidth={isActive ? 2 : 1.75}
                      size={22}
                    />
                  </span>
                  <span
                    className={`text-[10px] font-medium leading-none ${isActive ? "text-brand-700" : "text-ink-400"}`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}

          <li className="flex-1">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className="pressable relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1 py-2"
            >
              <span className="relative flex h-6 w-full items-center justify-center">
                {moreActive && (
                  <span className="absolute -top-2 h-1 w-6 rounded-full bg-brand-600" />
                )}
                <MoreHorizontalIcon
                  className={moreOpen || moreActive ? "text-brand-700" : "text-ink-400"}
                  strokeWidth={moreOpen || moreActive ? 2 : 1.75}
                  size={22}
                />
              </span>
              <span
                className={`text-[10px] font-medium leading-none ${moreOpen || moreActive ? "text-brand-700" : "text-ink-400"}`}
              >
                More
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
