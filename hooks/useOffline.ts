"use client";

import { useEffect, useState, useCallback } from "react";
import { pending, flush } from "@/lib/sync";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const refreshPending = useCallback(async () => {
    setPendingCount(await pending());
  }, []);

  useEffect(() => {
    function update() {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) refreshPending();
    }
    update();
    refreshPending();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const interval = setInterval(refreshPending, 5000);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      clearInterval(interval);
    };
  }, [refreshPending]);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      await flush();
      await refreshPending();
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPending]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      triggerSync();
    }
  }, [isOnline, pendingCount, triggerSync]);

  return { isOnline, pendingCount, isSyncing, lastSyncedAt, triggerSync };
}
