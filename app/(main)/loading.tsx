export default function MainLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-line" />
        <div className="h-12 w-72 rounded bg-line" />
        <div className="h-4 w-48 rounded bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-card bg-line" />
        <div className="h-24 rounded-card bg-line" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-line" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-40 shrink-0 rounded-card bg-line" />
          ))}
        </div>
      </div>
    </div>
  );
}
