"use client";

import { useOffline } from "@/hooks/useOffline";
import { WifiOffIcon, RefreshCwIcon, CheckCircleIcon } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOffline();

  if (!isOnline) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-medium text-amber-950">
        <WifiOffIcon size={14} />
        {pendingCount > 0
          ? `${pendingCount} change${pendingCount !== 1 ? "s" : ""} pending — reconnecting...`
          : "You're offline"}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-blue-500 px-4 py-1.5 text-sm font-medium text-blue-950">
        <RefreshCwIcon size={14} className="animate-spin" />
        Syncing changes...
      </div>
    );
  }

  return null;
}
