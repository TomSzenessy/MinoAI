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
        <header className="mb-12 text-center md:mb-16">
          {label ? (
            <div className="mx-auto mb-6 flex justify-center">
              <span className="section-label px-6 py-1.5">{label}</span>
            </div>
          ) : null}
          {title ? (
            <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl tracking-tight">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mx-auto mt-6 max-w-3xl text-base text-[var(--text-secondary)] md:text-lg leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
