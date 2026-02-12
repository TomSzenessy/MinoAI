"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PluginCard } from "@/components/plugin-card";
import { useTranslation } from "@/components/i18n-provider";
import { SettingsLayout, buildSettingsTabs } from "@/components/settings-layout";
import {
  PLUGIN_REGISTRY,
  isPluginEnabled,
  readPluginConfigs,
  togglePlugin,
  writePluginConfig,
  type PluginConfigMap,
  type PluginDefinition,
} from "@/lib/plugins";
import { readSettings, writeSettings, type UserSettings } from "@/lib/settings";

export default function PluginMarketplacePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [settings, setSettings] = useState<UserSettings>(() => readSettings());
  const [pluginConfigs, setPluginConfigs] = useState<PluginConfigMap>(() => readPluginConfigs());
  const [activePlugin, setActivePlugin] = useState<PluginDefinition | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const tabs = useMemo(() => buildSettingsTabs(t), [t]);

  const enabledCount = settings.enabledPlugins.length;

  return (
    <SettingsLayout
      title={t("settings.plugins.title")}
      tabs={tabs}
      activeTab="plugins"
      docsLabel={t("nav.docs")}
      workspaceLabel={t("nav.workspace")}
      onSelectTab={(tab) => {
        if (tab !== "plugins") {
          router.push("/settings");
        }
      }}
    >
      <div className="mb-4 rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
        <p className="text-sm text-[var(--text-secondary)]">{t("settings.plugins.subtitle")}</p>
        <p className="mt-1 font-medium text-[var(--text-primary)]">
          {enabledCount} {t("settings.plugins.enabled").toLowerCase()}
        </p>
      </div>

      <div className="grid gap-3">
        {PLUGIN_REGISTRY.map((plugin) => {
          const enabled = isPluginEnabled(plugin.id, settings.enabledPlugins);

          return (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              enabled={enabled}
              enabledLabel={t("settings.plugins.enabled")}
              disabledLabel={t("settings.plugins.disabled")}
              comingSoonLabel={t("settings.plugins.comingSoon")}
              configureLabel={t("settings.plugins.configure")}
              onToggle={(pluginId) => {
                const next = writeSettings({
                  enabledPlugins: togglePlugin(pluginId, settings.enabledPlugins),
                });
                setSettings(next);
              }}
              onConfigure={(pluginId) => {
                const selected = PLUGIN_REGISTRY.find((entry) => entry.id === pluginId) ?? null;
                setActivePlugin(selected);
                setApiKeyInput(pluginConfigs[pluginId]?.apiKey ?? "");
              }}
            />
          );
        })}
      </div>

      {activePlugin ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-mino-xl p-5">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              {activePlugin.name} · {t("settings.plugins.configure")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{activePlugin.description}</p>

            <label className="mt-4 block text-sm text-[var(--text-secondary)]">
              {t("settings.agent.apiKey")}
              <input
                className="field mt-2"
                type="password"
                value={apiKeyInput}
                onChange={(event) => setApiKeyInput(event.target.value)}
                placeholder={t("settings.agent.apiKeyPlaceholder")}
              />
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="button-secondary"
                onClick={() => {
                  setActivePlugin(null);
                  setApiKeyInput("");
                }}
              >
                {t("settings.plugins.close")}
              </button>
              <button
                className="button-primary"
                onClick={() => {
                  const next = writePluginConfig(activePlugin.id, { apiKey: apiKeyInput.trim() });
                  setPluginConfigs(next);
                  setActivePlugin(null);
                }}
              >
                {t("settings.plugins.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SettingsLayout>
  );
}
