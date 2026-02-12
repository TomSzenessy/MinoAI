"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LandingSection } from "@/components/landing-section";
import { Navbar } from "@/components/navbar";
import { useTranslation } from "@/components/i18n-provider";

const SECTION_IDS = [
  "hero",
  "preview",
  "features",
  "how-it-works",
  "agent",
  "stack",
  "open-source",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

export default function HomePage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SectionId>("hero");

  const navSections = useMemo(
    () => [
      { id: "hero", label: t("nav.home") },
      { id: "features", label: t("nav.features") },
      { id: "how-it-works", label: t("nav.howItWorks") },
      { id: "agent", label: t("nav.agent") },
      { id: "stack", label: t("nav.stack") },
      { id: "open-source", label: t("nav.openSource") },
    ],
    [t],
  );

  useEffect(() => {
    const nodes = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id && SECTION_IDS.includes(visible.target.id as SectionId)) {
          setActiveSection(visible.target.id as SectionId);
        }
      },
      {
        threshold: [0.2, 0.4, 0.7],
        rootMargin: "-30% 0px -30% 0px",
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, []);

  const featureCards = [
    { icon: "⤓", key: "features.smartImport" },
    { icon: "✦", key: "features.aiOrganization" },
    { icon: "⌕", key: "features.intelligentRetrieval" },
    { icon: "🔒", key: "features.selfHosted" },
    { icon: "⚡", key: "features.agentNative" },
    { icon: "☁", key: "features.everywhere" },
  ] as const;

  const techItems = [
    { icon: "🟠", key: "bun" },
    { icon: "🔥", key: "hono" },
    { icon: "▲", key: "nextjs" },
    { icon: "📱", key: "expo" },
    { icon: "🗄", key: "sqlite" },
    { icon: "🔄", key: "yjs" },
    { icon: "🤖", key: "mcp" },
    { icon: "📝", key: "md" },
  ] as const;

  const navigateTo = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden pb-16">
      <div className="mino-grid-overlay" />

      <div className="orb orb-purple left-[-8rem] top-[5rem] h-[18rem] w-[18rem]" />
      <div className="orb orb-blue right-[-6rem] top-[20rem] h-[16rem] w-[16rem]" />
      <div className="orb orb-pink bottom-[10rem] left-[35%] h-[14rem] w-[14rem]" />

      <Navbar sections={navSections} activeSection={activeSection} onNavigate={navigateTo} />

      <LandingSection id="hero" className="pt-32 pb-24 md:pt-36">
        <div className="mx-auto max-w-4xl text-center">
          <p className="section-label animate-fade-in-up">{t("hero.badge")}</p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            {t("hero.titleLine1")} <span className="gradient-text">{t("hero.titleLine2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base text-[var(--text-secondary)] md:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/link" className="button-primary">
              {t("hero.ctaPrimary")}
            </Link>
            <a
              href="https://github.com/mino-ink"
              target="_blank"
              rel="noreferrer"
              className="button-secondary"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <button className="scroll-hint mx-auto mt-12" onClick={() => navigateTo("preview")}>
            <span>{t("hero.scrollHint")}</span>
            <span className="scroll-hint-arrow" />
          </button>
        </div>
      </LandingSection>

      <LandingSection id="preview" className="pb-24">
        <div className="preview-window mx-auto max-w-5xl">
          <div className="preview-titlebar">
            <span className="preview-dot bg-[#ef4444]" />
            <span className="preview-dot bg-[#f59e0b]" />
            <span className="preview-dot bg-[#22c55e]" />
            <span className="preview-url">{t("preview.url")}</span>
          </div>
          <div className="preview-body">
            <aside className="preview-sidebar">
              <div className="preview-sidebar-item active">Workspace</div>
              <div className="preview-sidebar-item">Projects</div>
              <div className="preview-sidebar-item">Research</div>
              <div className="preview-sidebar-item">Daily Notes</div>
              <div className="preview-sidebar-item">Inbox</div>
            </aside>
            <div className="preview-editor">
              <h3>MOC-Architecture</h3>
              <p>- Linked to: `System-Design.md`, `Scalability.md`, `Infra-Choices.md`</p>
              <p>- Tags: #core-systems #backend #planning</p>
              <p className="mt-4">Agent update:</p>
              <p>• Added backlinks between related architecture notes.</p>
              <p>• Created section summaries for fast retrieval.</p>
              <p>• Suggested two missing documents from recent imports.</p>
            </div>
          </div>
        </div>
      </LandingSection>

      <LandingSection
        id="features"
        label={t("features.label")}
        title={
          <>
            {t("features.title")} <span className="gradient-text">{t("features.titleHighlight")}</span>
          </>
        }
        subtitle={t("features.subtitle")}
        className="pb-24"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <article key={feature.key} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="mb-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                {t(`${feature.key}.title`)}
              </h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{t(`${feature.key}.description`)}</p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="how-it-works"
        label={t("howItWorks.label")}
        title={
          <>
            {t("howItWorks.title")} <span className="gradient-text">{t("howItWorks.titleHighlight")}</span>{" "}
            {t("howItWorks.titleEnd")}
          </>
        }
        subtitle={t("howItWorks.subtitle")}
        className="pb-24"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <article key={step} className="step-card">
              <div className="step-number">{step}</div>
              <h3 className="mb-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                {t(`howItWorks.step${step}.title`)}
              </h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {t(`howItWorks.step${step}.description`)}
              </p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="agent"
        label={t("agent.label")}
        title={
          <>
            {t("agent.title")} <span className="gradient-text">{t("agent.titleHighlight")}</span>
          </>
        }
        subtitle={t("agent.subtitle")}
        className="pb-24"
      >
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="agent-demo">
            <div className="preview-titlebar">
              <span className="rounded-full border border-[rgba(187,134,252,0.2)] bg-[rgba(187,134,252,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--purple-300)]">
                {t("agent.badge")}
              </span>
              <span className="preview-url">ai-organizer.mino</span>
            </div>
            <div className="agent-chat">
              <div className="chat-bubble agent" dangerouslySetInnerHTML={{ __html: t("agent.chatMsg1") }} />
              <div className="chat-bubble user" dangerouslySetInnerHTML={{ __html: t("agent.chatMsg2") }} />
              <div className="chat-bubble agent" dangerouslySetInnerHTML={{ __html: t("agent.chatMsg3") }} />
            </div>
          </div>

          <aside className="agent-demo">
            <div className="capability-item">
              <span className="capability-dot" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t("agent.capability1Title")}</p>
                <p className="text-xs text-[var(--text-secondary)]">{t("agent.capability1Desc")}</p>
              </div>
            </div>
            <div className="capability-item">
              <span className="capability-dot" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t("agent.capability2Title")}</p>
                <p className="text-xs text-[var(--text-secondary)]">{t("agent.capability2Desc")}</p>
              </div>
            </div>
            <div className="capability-item">
              <span className="capability-dot" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t("agent.capability3Title")}</p>
                <p className="text-xs text-[var(--text-secondary)]">{t("agent.capability3Desc")}</p>
              </div>
            </div>
            <div className="capability-item">
              <span className="capability-dot" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t("agent.capability4Title")}</p>
                <p className="text-xs text-[var(--text-secondary)]">{t("agent.capability4Desc")}</p>
              </div>
            </div>
          </aside>
        </div>
      </LandingSection>

      <LandingSection
        id="stack"
        label={t("tech.label")}
        title={
          <>
            {t("tech.title")} <span className="gradient-text">{t("tech.titleHighlight")}</span>
          </>
        }
        subtitle={t("tech.subtitle")}
        className="pb-24"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {techItems.map((item) => (
            <article key={item.key} className="tech-item">
              <p className="tech-icon">{item.icon}</p>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">{item.key.toUpperCase()}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{t(`tech.items.${item.key}`)}</p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="open-source"
        label={t("openSource.label")}
        title={<>{t("openSource.title")}</>}
        subtitle={t("openSource.subtitle")}
        className="pb-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="terminal-block">
            <span className="terminal-prompt">$</span>
            <code>{t("openSource.installCmd")}</code>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/link" className="button-primary">
              {t("openSource.ctaPrimary")}
            </Link>
            <a
              href="https://github.com/mino-ink"
              target="_blank"
              rel="noreferrer"
              className="button-secondary"
            >
              {t("openSource.ctaSecondary")}
            </a>
          </div>
        </div>
      </LandingSection>

      <footer className="footer mx-auto mt-4 w-full max-w-6xl px-6">
        <p className="mb-3 text-sm text-[var(--text-tertiary)]">{t("footer.tagline")}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="footer-link">{t("footer.terms")}</Link>
          <Link href="/cookies" className="footer-link">{t("footer.cookies")}</Link>
          <Link href="/privacy" className="footer-link">{t("footer.privacy")}</Link>
          <Link href="/docs" className="footer-link">{t("nav.docs")}</Link>
          <Link href="/settings" className="footer-link">{t("nav.settings")}</Link>
        </div>
      </footer>
    </main>
  );
}
