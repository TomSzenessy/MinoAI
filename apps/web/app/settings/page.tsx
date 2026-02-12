"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { LOCALE_NAMES, SUPPORTED_LOCALES, useTranslation } from "@/components/i18n-provider";
import { SettingsLayout, buildSettingsTabs, type SettingsTabId } from "@/components/settings-layout";
import { fetchHealth, type HealthPayload } from "@/lib/api";
import { PLUGIN_REGISTRY, isPluginEnabled, togglePlugin } from "@/lib/plugins";
import { readSettings, writeSettings, type UserSettings, type UserSettingsUpdate } from "@/lib/settings";
import { getActiveProfile, type LinkedServerProfile } from "@/lib/storage";

export default function SettingsPage() {
  const { locale, setLocale, t } = useTranslation();
  const { setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
  const [settings, setSettings] = useState<UserSettings>(() => readSettings());
  const [profile, setProfile] = useState<LinkedServerProfile | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    const initial = readSettings();
    setSettings(initial);

    if (initial.locale !== locale) {
      setLocale(initial.locale);
    }

    const activeProfile = getActiveProfile();
    setProfile(activeProfile);

    if (!activeProfile) return;

    fetchHealth(activeProfile.serverUrl, activeProfile.apiKey)
      .then((data) => {
        setHealth(data);
        setHealthError(null);
      })
      .catch((error) => {
        setHealthError(error instanceof Error ? error.message : "Unable to load server status.");
      });
  }, [locale, setLocale]);

  const tabs = useMemo(() => buildSettingsTabs(t), [t]);

  const updateSettings = (update: UserSettingsUpdate) => {
    const next = writeSettings(update);
    setSettings(next);
  };

  return (
    <SettingsLayout
      title={t("settings.title")}
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      docsLabel={t("nav.docs")}
      workspaceLabel={t("nav.workspace")}
      rightActions={
        <Link href="/settings/plugins" className="button-secondary text-sm">
          {t("settings.tabs.plugins")}
        </Link>
      }
    >
      {activeTab === "general" ? (
        <div className="space-y-6">
          <section>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              {t("settings.general.language")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("settings.general.languageDesc")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map((option) => (
                <button
                  key={option}
                  className={`button-secondary text-xs ${locale === option ? "!border-[var(--purple-400)] !text-[var(--text-primary)]" : ""}`}
                  onClick={() => {
                    setLocale(option);
                    updateSettings({ locale: option });
                  }}
                >
                  {LOCALE_NAMES[option]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              {t("settings.general.theme")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("settings.general.themeDesc")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                { key: "dark", label: t("settings.general.dark") },
                { key: "light", label: t("settings.general.light") },
                { key: "system", label: t("settings.general.system") },
              ] as const).map((themeOption) => (
                <button
                  key={themeOption.key}
                  className={`button-secondary text-xs ${settings.theme === themeOption.key ? "!border-[var(--purple-400)] !text-[var(--text-primary)]" : ""}`}
                  onClick={() => {
                    setTheme(themeOption.key);
                    updateSettings({ theme: themeOption.key });
                  }}
                >
                  {themeOption.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "server" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{t("settings.server.title")}</h2>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">{t("settings.server.serverUrl")}</p>
            <p className="font-medium text-[var(--text-primary)]">{profile?.serverUrl ?? "-"}</p>
          </div>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Status</p>
            <p className="font-medium text-[var(--text-primary)]">
              {profile ? (healthError ? t("settings.server.disconnected") : t("settings.server.connected")) : t("settings.server.disconnected")}
            </p>
            {health ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                {t("settings.server.lastVerified")}: v{health.version} · {health.uptimeSeconds}s
              </p>
            ) : null}
            {healthError ? <p className="mt-1 text-xs text-rose-300">{healthError}</p> : null}
          </div>

          <Link href="/link" className="button-primary inline-flex">
            {t("settings.server.relink")}
          </Link>
        </div>
      ) : null}

      {activeTab === "agent" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{t("settings.agent.title")}</h2>

          <div className="flex items-center justify-between rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <span className="text-sm text-[var(--text-secondary)]">{t("settings.agent.enabled")}</span>
            <button
              className={`toggle-switch ${settings.agent.enabled ? "active" : ""}`}
              onClick={() =>
                updateSettings({
                  agent: {
                    ...settings.agent,
                    enabled: !settings.agent.enabled,
                  },
                })
              }
            />
          </div>

          <label className="block text-sm text-[var(--text-secondary)]">
            {t("settings.agent.model")}
            <select
              className="field mt-2"
              value={settings.agent.model}
              onChange={(event) =>
                updateSettings({
                  agent: {
                    ...settings.agent,
                    model: event.target.value,
                  },
                })
              }
            >
              <option value="anthropic/claude-sonnet-4-20250514">Claude Sonnet 4</option>
              <option value="openai/gpt-5">OpenAI GPT-5</option>
              <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </label>

          <label className="block text-sm text-[var(--text-secondary)]">
            {t("settings.agent.apiKey")}
            <input
              className="field mt-2"
              type="password"
              value={settings.agent.apiKey}
              placeholder={t("settings.agent.apiKeyPlaceholder")}
              onChange={(event) =>
                updateSettings({
                  agent: {
                    ...settings.agent,
                    apiKey: event.target.value,
                  },
                })
              }
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-[var(--text-secondary)]">{t("settings.agent.permissions")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { key: "read", label: t("settings.agent.read") },
                { key: "write", label: t("settings.agent.write") },
                { key: "edit", label: t("settings.agent.edit") },
                { key: "delete", label: t("settings.agent.delete") },
                { key: "organize", label: t("settings.agent.organize") },
              ] as const).map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                >
                  <span>{permission.label}</span>
                  <button
                    className={`toggle-switch ${settings.agent.permissions[permission.key] ? "active" : ""}`}
                    onClick={(event) => {
                      event.preventDefault();
                      updateSettings({
                        agent: {
                          ...settings.agent,
                          permissions: {
                            ...settings.agent.permissions,
                            [permission.key]: !settings.agent.permissions[permission.key],
                          },
                        },
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "plugins" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{t("settings.plugins.title")}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{t("settings.plugins.subtitle")}</p>

          <div className="grid gap-2">
            {PLUGIN_REGISTRY.slice(0, 5).map((plugin) => {
              const enabled = isPluginEnabled(plugin.id, settings.enabledPlugins);

              return (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{plugin.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{plugin.description}</p>
                  </div>
                  <button
                    className={`toggle-switch ${enabled ? "active" : ""}`}
                    onClick={() =>
                      updateSettings({
                        enabledPlugins: togglePlugin(plugin.id, settings.enabledPlugins),
                      })
                    }
                    disabled={plugin.status !== "available"}
                  />
                </div>
              );
            })}
          </div>

          <Link href="/settings/plugins" className="button-secondary inline-flex text-sm">
            {t("settings.plugins.configure")}
          </Link>
        </div>
      ) : null}

      {activeTab === "about" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{t("settings.about.title")}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{t("settings.about.description")}</p>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 text-sm">
            <p className="text-[var(--text-secondary)]">{t("settings.about.version")}</p>
            <p className="font-medium text-[var(--text-primary)]">0.1.0</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a href="https://github.com/mino-ink" target="_blank" rel="noreferrer" className="button-secondary text-sm">
              {t("settings.about.github")}
            </a>
            <Link href="/docs" className="button-secondary text-sm">
              {t("settings.about.docs")}
            </Link>
            <Link href="/terms" className="button-secondary text-sm">
              {t("settings.about.terms")}
            </Link>
            <Link href="/privacy" className="button-secondary text-sm">
              {t("settings.about.privacy")}
            </Link>
          </div>
        </div>
      ) : null}
    </SettingsLayout>
  );
}
