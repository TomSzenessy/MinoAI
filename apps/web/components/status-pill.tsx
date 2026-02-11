interface StatusPillProps {
  label: string;
  tone: "ok" | "warn" | "error";
}

export function StatusPill({ label, tone }: StatusPillProps) {
  const toneMap = {
    ok: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    warn: "bg-amber-500/15 text-amber-300 border-amber-400/20",
    error: "bg-rose-500/15 text-rose-300 border-rose-400/20",
  } as const;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
