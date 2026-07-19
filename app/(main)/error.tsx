"use client";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] font-medium text-ink-900">
        Something went wrong
      </p>
      <p className="mt-1 text-[13px] text-ink-400">
        {error.message ?? "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        className="pressable mt-6 rounded-full bg-brand-600 px-5 py-2 text-[13px] font-medium text-paper-0 transition-colors hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
