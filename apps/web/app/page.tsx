"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LandingSection } from "@/components/landing-section";
import { LandingBg } from "@/components/landing-bg";
import { Navbar } from "@/components/navbar";
import { useTranslation } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { getActiveProfile } from "@/lib/storage";

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

export default function LandingPage() {
  const { t } = useTranslation();
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  useEffect(() => {
    const profile = getActiveProfile();
    if (profile) {
      setActiveProfileId(profile.id);
    }
  }, []);
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
    const nodes = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (
          visible?.target.id &&
          SECTION_IDS.includes(visible.target.id as SectionId)
        ) {
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

  const featureCards: ReadonlyArray<{
    icon: string;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
  }> = [
    {
      icon: "⤓",
      titleKey: "features.smartImport.title",
      descriptionKey: "features.smartImport.description",
    },
    {
      icon: "✦",
      titleKey: "features.aiOrganization.title",
      descriptionKey: "features.aiOrganization.description",
    },
    {
      icon: "⌕",
      titleKey: "features.intelligentRetrieval.title",
      descriptionKey: "features.intelligentRetrieval.description",
    },
    {
      icon: "🔒",
      titleKey: "features.selfHosted.title",
      descriptionKey: "features.selfHosted.description",
    },
    {
      icon: "⚡",
      titleKey: "features.agentNative.title",
      descriptionKey: "features.agentNative.description",
    },
    {
      icon: "☁",
      titleKey: "features.everywhere.title",
      descriptionKey: "features.everywhere.description",
    },
  ];

  const howItWorksSteps: ReadonlyArray<{
    number: "01" | "02" | "03";
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
  }> = [
    {
      number: "01",
      titleKey: "howItWorks.step1.title",
      descriptionKey: "howItWorks.step1.description",
    },
    {
      number: "02",
      titleKey: "howItWorks.step2.title",
      descriptionKey: "howItWorks.step2.description",
    },
    {
      number: "03",
      titleKey: "howItWorks.step3.title",
      descriptionKey: "howItWorks.step3.description",
    },
  ];

  const capabilityCards: ReadonlyArray<{
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
  }> = [
    {
      titleKey: "agent.capability1Title",
      descriptionKey: "agent.capability1Desc",
    },
    {
      titleKey: "agent.capability2Title",
      descriptionKey: "agent.capability2Desc",
    },
    {
      titleKey: "agent.capability3Title",
      descriptionKey: "agent.capability3Desc",
    },
    {
      titleKey: "agent.capability4Title",
      descriptionKey: "agent.capability4Desc",
    },
  ];

  const techItems: ReadonlyArray<{
    icon: string;
    label: string;
    descriptionKey: TranslationKey;
  }> = [
    { icon: "🟠", label: "BUN", descriptionKey: "tech.items.bun" },
    { icon: "🔥", label: "HONO", descriptionKey: "tech.items.hono" },
    { icon: "▲", label: "NEXTJS", descriptionKey: "tech.items.nextjs" },
    { icon: "📱", label: "EXPO", descriptionKey: "tech.items.expo" },
    { icon: "🗄", label: "SQLITE", descriptionKey: "tech.items.sqlite" },
    { icon: "🔄", label: "YJS", descriptionKey: "tech.items.yjs" },
    { icon: "🤖", label: "MCP", descriptionKey: "tech.items.mcp" },
    { icon: "📝", label: "MD", descriptionKey: "tech.items.md" },
  ];

  const navigateTo = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden pb-16">
      <LandingBg />

      <Navbar
        sections={navSections}
        activeSection={activeSection}
        onNavigate={navigateTo}
      />

      <LandingSection id="hero" className="pt-32 pb-24 md:pt-36">
        <div className="mx-auto max-w-4xl text-center">
          <div className="hero-badge mx-auto mb-8 animate-fade-up">
            <span className="dot" />
            {t("hero.badge")}
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl animate-fade-up [animation-delay:200ms]">
            {t("hero.titleLine1")} <br />
            <span className="gradient-text">{t("hero.titleLine2")}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base text-[var(--text-secondary)] md:text-lg animate-fade-up [animation-delay:400ms]">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-up [animation-delay:600ms]">
            <Link
              href={
                activeProfileId
                  ? `/workspace?profile=${activeProfileId}`
                  : "/workspace?mode=local"
              }
              className="button-primary px-8 py-3 text-lg"
            >
              {activeProfileId ? t("hero.ctaResume") : t("hero.ctaPrimary")}
            </Link>
            <a
              href="https://github.com/ToumS/Mino"
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary px-8 py-3 text-lg"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <button
            className="scroll-hint mx-auto mt-16 animate-fade-up [animation-delay:800ms]"
            onClick={() => navigateTo("preview")}
          >
            <span className="text-sm font-medium tracking-wide">
              {t("hero.scrollHint")}
            </span>
            <div className="scroll-hint-arrow mt-2 animate-bounce-slow" />
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
              <p>
                - Linked to: `System-Design.md`, `Scalability.md`,
                `Infra-Choices.md`
              </p>
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
            {t("features.title")}{" "}
            <span className="gradient-text">
              {t("features.titleHighlight")}
            </span>
          </>
        }
        subtitle={t("features.subtitle")}
        className="pb-32"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature, idx) => (
            <article
              key={feature.titleKey}
              className="feature-card group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="feature-icon mb-6 group-hover:scale-110 transition-transform duration-slow">
                {feature.icon}
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-[var(--text-primary)]">
                {t(feature.titleKey)}
              </h3>
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {t(feature.descriptionKey)}
              </p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="how-it-works"
        label={t("howItWorks.label")}
        title={
          <>
            {t("howItWorks.title")}{" "}
            <span className="gradient-text">
              {t("howItWorks.titleHighlight")}
            </span>{" "}
            {t("howItWorks.titleEnd")}
          </>
        }
        subtitle={t("howItWorks.subtitle")}
        className="pb-32"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {howItWorksSteps.map((step, idx) => (
            <article
              key={step.titleKey}
              className="step-card group"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="step-number mb-6 group-hover:scale-110 transition-transform duration-slow">
                {step.number}
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-[var(--text-primary)]">
                {t(step.titleKey)}
              </h3>
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {t(step.descriptionKey)}
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
            {t("agent.title")}{" "}
            <span className="gradient-text">{t("agent.titleHighlight")}</span>
          </>
        }
        subtitle={t("agent.subtitle")}
        className="pb-32"
      >
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          <div className="agent-demo glass-card overflow-hidden shadow-mino-lg">
            <div className="preview-titlebar px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mino-purple text-[12px] text-white font-bold">
                  ✦
                </span>
                <span className="text-sm font-semibold tracking-wide text-mino-purple">
                  AI Organizer
                </span>
                <span className="rounded-full border border-mino-purple/20 bg-mino-purple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mino-purple">
                  {t("agent.badge")}
                </span>
              </div>
              <span className="text-xs font-mono text-mino-purple/40">
                v0.4.2-beta
              </span>
            </div>
            <div className="agent-chat p-8 min-h-[300px] flex flex-col gap-6 bg-mino-surface/40 backdrop-blur-md">
              <div className="flex gap-4 items-start animate-fade-up">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mino-purple text-white shadow-mino-sm">
                  ✦
                </div>
                <div
                  className="chat-bubble agent bg-mino-purple/10 border border-mino-purple/20 p-4 rounded-2xl rounded-tl-none text-[15px] shadow-sm"
                  dangerouslySetInnerHTML={{ __html: t("agent.chatMsg1") }}
                />
              </div>
              <div className="flex gap-4 items-start justify-end animate-fade-up [animation-delay:200ms]">
                <div
                  className="chat-bubble user bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tr-none text-[15px] shadow-sm ml-12"
                  dangerouslySetInnerHTML={{ __html: t("agent.chatMsg2") }}
                />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold">
                  T
                </div>
              </div>
              <div className="flex gap-4 items-start animate-fade-up [animation-delay:400ms]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mino-purple text-white shadow-mino-sm">
                  ✦
                </div>
                <div
                  className="chat-bubble agent bg-mino-purple/10 border border-mino-purple/20 p-4 rounded-2xl rounded-tl-none text-[15px] shadow-sm mr-12"
                  dangerouslySetInnerHTML={{ __html: t("agent.chatMsg3") }}
                />
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            {capabilityCards.map((capability, idx) => (
              <div
                key={capability.titleKey}
                className="capability-item group glass-card p-5 flex items-start gap-4 hover:border-mino-purple/30 transition-all cursor-default"
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                <span className="capability-dot mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                <div>
                  <h4 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
                    {t(capability.titleKey)}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {t(capability.descriptionKey)}
                  </p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </LandingSection>

      <LandingSection
        id="stack"
        label={t("tech.label")}
        title={
          <>
            {t("tech.title")}{" "}
            <span className="gradient-text">{t("tech.titleHighlight")}</span>
          </>
        }
        subtitle={t("tech.subtitle")}
        className="pb-32"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {techItems.map((item, idx) => (
            <article
              key={item.descriptionKey}
              className="tech-item group transition-all duration-300 hover:border-mino-purple/30"
              style={{ animationDelay: `${idx * 75}ms` }}
            >
              <p className="tech-icon mb-4 group-hover:scale-125 transition-transform duration-slow">
                {item.icon}
              </p>
              <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)] mb-1">
                {item.label}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">
                {t(item.descriptionKey)}
              </p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="open-source"
        label={t("openSource.label")}
        title={<>{t("openSource.title")}</>}
        subtitle={t("openSource.subtitle")}
        className="pb-40"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="terminal-block overflow-hidden relative shadow-mino-md">
            <div className="absolute top-0 left-0 right-0 h-1 bg-mino-purple/20" />
            <span className="terminal-prompt font-mono text-mino-purple/50 pr-2">
              $
            </span>
            <code className="font-mono text-mino-purple drop-shadow-sm select-all">
              {t("openSource.installCmd")}
            </code>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link href="/link" className="button-primary px-10 py-4 text-lg">
              ✦ {t("openSource.ctaPrimary")}
            </Link>
            <a
              href="https://github.com/mino-ink"
              target="_blank"
              rel="noreferrer"
              className="button-secondary px-10 py-4 text-lg"
            >
              ↗ {t("openSource.ctaSecondary")}
            </a>
          </div>
        </div>
      </LandingSection>

      <footer className="footer mx-auto mt-4 w-full max-w-6xl px-6 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-mino-purple animate-pulse" />
              <p className="text-sm font-medium tracking-tight text-[var(--text-tertiary)]">
                {t("footer.tagline")}
              </p>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] opacity-60">
              © 2026 Mino. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/terms"
              className="footer-link hover:text-white transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/cookies"
              className="footer-link hover:text-white transition-colors"
            >
              {t("footer.cookies")}
            </Link>
            <Link
              href="/privacy"
              className="footer-link hover:text-white transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/docs"
              className="footer-link hover:text-white transition-colors"
            >
              {t("nav.docs")}
            </Link>
            <Link
              href="/settings"
              className="footer-link hover:text-white transition-colors text-mino-purple/70"
            >
              {t("nav.settings")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
