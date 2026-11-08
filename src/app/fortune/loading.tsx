export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="glass h-40 animate-pulse rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass h-32 animate-pulse rounded-2xl" />
        <div className="glass h-32 animate-pulse rounded-2xl" />
      </div>
      <span className="sr-only">กำลังโหลด…</span>
    </div>
  );
}
