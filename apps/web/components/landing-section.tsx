import type { ReactNode } from "react";

interface LandingSectionProps {
  id: string;
  label?: string;
  title?: ReactNode;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export function LandingSection({
  id,
  label,
  title,
  subtitle,
  className,
  children,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      data-section={id}
      className={className ? `relative mx-auto w-full max-w-6xl px-6 ${className}` : "relative mx-auto w-full max-w-6xl px-6"}
    >
      {(label || title || subtitle) ? (
        <header className="mb-8 text-center md:mb-10">
          {label ? <p className="section-label">{label}</p> : null}
          {title ? <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">{title}</h2> : null}
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-3xl text-sm text-[var(--text-secondary)] md:text-base">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
