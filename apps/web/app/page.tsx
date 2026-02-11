import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const featureList = [
  {
    title: "Portainer-first setup",
    text: "Copy/paste a single compose stack, deploy, and link with prefilled credentials.",
  },
  {
    title: "Agent-native API",
    text: "Your server is designed for both humans and AI agents via authenticated endpoints.",
  },
  {
    title: "Hybrid access",
    text: "Use test.mino.ink, mino.ink, localhost, LAN, or tunnel URLs with the same link flow.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="glass-card flex items-center justify-between rounded-full px-4 py-3 md:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            <Link href="/docs" className="button-secondary text-sm">
              Docs
            </Link>
            <Link href="/link" className="button-primary text-sm">
              Connect Server
            </Link>
          </nav>
        </header>

        <section className="mx-auto max-w-3xl pt-10 text-center md:pt-20">
          <p className="mb-4 inline-flex items-center rounded-full border border-[rgba(187,134,252,0.24)] bg-[rgba(187,134,252,0.12)] px-4 py-1 text-xs font-medium tracking-wide text-[var(--purple-200)]">
            test.mino.ink ready
          </p>
          <h1 className="mb-5 font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            Your Mind, <span className="text-[var(--purple-300)]">Organized.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            Deploy your server in Portainer, click the generated `/link` URL, and Mino connects with zero
            manual input.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/link" className="button-primary">
              Open Link Handler
            </Link>
            <Link href="/workspace" className="button-secondary">
              Open Workspace
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-14 md:grid-cols-3">
          {featureList.map((feature) => (
            <article key={feature.title} className="glass-card rounded-mino-xl p-6">
              <h2 className="mb-2 font-display text-xl font-semibold text-white">{feature.title}</h2>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{feature.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
