"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import type { TranslationFn } from "@/lib/i18n";

export type SettingsTabId = "general" | "server" | "agent" | "plugins" | "about";

interface TabItem {
  id: SettingsTabId;
  label: string;
}

export function buildSettingsTabs(t: TranslationFn): TabItem[] {
  return [
    { id: "general", label: t("settings.tabs.general") },
    { id: "server", label: t("settings.tabs.server") },
    { id: "agent", label: t("settings.tabs.agent") },
    { id: "plugins", label: t("settings.tabs.plugins") },
    { id: "about", label: t("settings.tabs.about") },
  ];
}

interface SettingsLayoutProps {
  title: string;
  tabs: TabItem[];
  activeTab: SettingsTabId;
  onSelectTab?: (tab: SettingsTabId) => void;
  docsLabel?: string;
  workspaceLabel?: string;
  rightActions?: ReactNode;
  children: ReactNode;
}

export function SettingsLayout({
  title,
  tabs,
  activeTab,
  onSelectTab,
  docsLabel = "Docs",
  workspaceLabel = "Workspace",
  rightActions,
  children,
}: SettingsLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6">
        <header className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-full px-4 py-3 md:px-6">
          <Link href="/">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/docs" className="button-secondary text-sm">
              {docsLabel}
            </Link>
            <Link href="/workspace" className="button-secondary text-sm">
              {workspaceLabel}
            </Link>
          </div>
        </header>

        <section className="glass-card rounded-mino-2xl p-5 md:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">{title}</h1>
            {rightActions}
          </div>

          <div className="settings-tabs mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => onSelectTab?.(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>{children}</div>
        </section>
      </div>
    </main>
  );
}
