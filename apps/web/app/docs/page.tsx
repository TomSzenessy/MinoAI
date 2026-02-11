import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { getAllDocPages, toDocHref } from "@/lib/docs";

export default function DocsIndexPage() {
  const pages = getAllDocPages();
  const blueprint = pages.filter((page) => page.source === "blueprint");
  const docstart = pages.filter((page) => page.source === "docstart");

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto max-w-6xl">
        <header className="glass-card mb-8 flex items-center justify-between rounded-full px-4 py-3 md:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            <Link href="/" className="button-secondary text-sm">
              Home
            </Link>
            <Link href="/link" className="button-primary text-sm">
              Connect
            </Link>
          </nav>
        </header>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)] md:text-base">
            `test.mino.ink/docs` includes both tracks: blueprint docs from `/docs` and implementation docs from
            `/docstart`.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-card rounded-mino-2xl p-6">
            <h2 className="mb-1 font-display text-2xl font-semibold text-white">Blueprint (`/docs`)</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Architecture, design system, roadmap, and long-term product model.
            </p>
            <ul className="space-y-2">
              {blueprint.map((page) => (
                <li key={`${page.source}:${page.relativePath}`}>
                  <Link
                    href={toDocHref(page)}
                    className="block rounded-lg border border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[rgba(187,134,252,0.25)] hover:bg-[rgba(187,134,252,0.08)] hover:text-white"
                  >
                    {page.title}
                    <span className="ml-2 text-xs text-[var(--text-tertiary)]">{page.relativePath}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card rounded-mino-2xl p-6">
            <h2 className="mb-1 font-display text-2xl font-semibold text-white">Implementation (`/docstart`)</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Portainer setup, linking flow, local build, troubleshooting, and integration references.
            </p>
            <ul className="space-y-2">
              {docstart.map((page) => (
                <li key={`${page.source}:${page.relativePath}`}>
                  <Link
                    href={toDocHref(page)}
                    className="block rounded-lg border border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[rgba(187,134,252,0.25)] hover:bg-[rgba(187,134,252,0.08)] hover:text-white"
                  >
                    {page.title}
                    <span className="ml-2 text-xs text-[var(--text-tertiary)]">{page.relativePath}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
