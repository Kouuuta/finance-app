"use client";

import { useEffect, useState } from "react";
import { XIcon, RefreshCwIcon } from "lucide-react";

export function PwaRegister() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleUpdate() {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    setShowUpdate(false);
  }

  async function handleInstall() {
    if (!installPrompt) return;
    const prompt = installPrompt as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstall(false);
    }
  }

  return (
    <>
      {showUpdate && (
        <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-paper-0 px-4 py-3 shadow-lg md:bottom-8">
          <span className="text-sm text-ink-700">New version available</span>
          <button
            onClick={handleUpdate}
            className="pressable flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-paper-0 transition-colors hover:bg-brand-700"
          >
            <RefreshCwIcon size={14} />
            Update
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="pressable rounded-lg p-1.5 text-ink-400 hover:text-ink-700"
            aria-label="Dismiss"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {showInstall && (
        <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-paper-0 px-4 py-3 shadow-lg md:bottom-8">
          <span className="text-sm text-ink-700">Install on your device</span>
          <button
            onClick={handleInstall}
            className="pressable rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-paper-0 transition-colors hover:bg-brand-700"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstall(false)}
            className="pressable rounded-lg p-1.5 text-ink-400 hover:text-ink-700"
            aria-label="Dismiss"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}
    </>
  );
}
