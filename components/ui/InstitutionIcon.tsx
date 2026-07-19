"use client";

import {
  SmartphoneIcon,
  Building2Icon,
  CreditCardIcon,
  BanknoteIcon,
  WalletIcon,
} from "lucide-react";

const ICONS: Record<string, typeof SmartphoneIcon> = {
  ewallet: SmartphoneIcon,
  bank: Building2Icon,
  savings: Building2Icon,
  bnpl: CreditCardIcon,
  cash: BanknoteIcon,
  other: WalletIcon,
};

interface InstitutionIconProps {
  type: string;
  className?: string;
  logoUrl?: string | null;
  institutionName?: string;
}

export function InstitutionIcon({
  type,
  className = "h-4 w-4",
  logoUrl,
  institutionName,
}: InstitutionIconProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={institutionName ?? type}
        width={20}
        height={20}
        className={className}
      />
    );
  }

  const Icon = ICONS[type] ?? WalletIcon;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
