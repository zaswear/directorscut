export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40dvh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        <p className="text-xs text-text-faint font-mono">Cargando…</p>
      </div>
    </div>
  );
}
