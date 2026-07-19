"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  HomeIcon,
  WalletIcon,
  ListIcon,
  TargetIcon,
  LineChartIcon,
} from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: typeof HomeIcon;
}

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/accounts", label: "Accounts", icon: WalletIcon },
  { to: "/transactions", label: "Ledger", icon: ListIcon },
  { to: "/goals", label: "Goals", icon: TargetIcon },
  { to: "/investments", label: "Invest", icon: LineChartIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-paper-50 text-ink-900">
      <DesktopRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10">
          {children}
        </main>
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
        L
      </span>
      <ul className="flex flex-col items-center gap-1">
        {NAV.map((item) => (
          <li key={item.to}>
            <RailLink item={item} />
          </li>
        ))}
      </ul>
      <div className="mt-auto">
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

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hair border-line bg-paper-0/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV.map((item) => {
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
                    className={
                      isActive ? "text-brand-700" : "text-ink-400"
                    }
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
      </ul>
    </nav>
  );
}
