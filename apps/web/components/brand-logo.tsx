interface BrandLogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function BrandLogo({ className, withWordmark = true }: BrandLogoProps) {
  return (
    <div className={className ? `flex items-center gap-2 ${className}` : "flex items-center gap-2"}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse cx="50" cy="100" rx="17" ry="50" fill="#BB86FC" />
        <ellipse cx="100" cy="100" rx="20" ry="70" fill="#BB86FC" />
        <ellipse cx="150" cy="100" rx="17" ry="50" fill="#BB86FC" />
      </svg>
      {withWordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">ino</span>
      ) : null}
    </div>
  );
}
