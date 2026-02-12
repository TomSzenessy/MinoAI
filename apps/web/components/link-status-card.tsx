import type { ReactNode } from "react";

interface LinkStatusCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function LinkStatusCard({ title, description, children }: LinkStatusCardProps) {
  return (
    <div className="glass-card w-full max-w-xl rounded-mino-2xl p-8">
      <h1 className="mb-3 font-display text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">{description}</p>
      {children}
    </div>
  );
}
