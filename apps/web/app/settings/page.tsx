"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  useTranslation,
} from "@/components/i18n-provider";
import {
  SettingsLayout,
  buildSettingsTabs,
  isSettingsTabId,
  type SettingsTabId,
} from "@/components/settings-layout";
import {
  fetchAgentStatus,
  fetchChannelProviders,
  fetchChannels,
  fetchHealth,
  fetchPluginCatalog,
  fetchPlugins,
  installPluginOnServer,
  toggleChannelOnServer,
  togglePluginOnServer,
  uninstallPluginOnServer,
  upsertChannelOnServer,
  updatePluginConfigOnServer,
  deleteChannelOnServer,
  type AgentStatusPayload,
  type ChannelConfig,
  type ChannelProviderCapabilities,
  type ChannelProvider,
  type HealthPayload,
  type PluginCatalogItem,
  type PluginManifest,
} from "@/lib/api";
import {
  isPluginEnabled,
  PLUGIN_REGISTRY,
  togglePlugin,
} from "@/lib/plugins";
import {
  readSettings,
  writeSettings,
  type UserSettings,
  type UserSettingsUpdate,
} from "@/lib/settings";
import {
  getFallbackProfile,
  type LinkedServerProfile,
} from "@/lib/storage";

interface ChannelFormState {
  type: ChannelProvider;
  name: string;
  webhookSecret: string;
  credentials: Record<string, string>;
}

const INITIAL_CHANNEL_FORM: ChannelFormState = {
  type: "telegram",
  name: "",
  webhookSecret: "",
  credentials: {},
};

const DEFAULT_CHANNEL_PROVIDERS: ChannelProviderCapabilities[] = [
  {
    provider: "telegram",
    label: "Telegram",
    requiredCredentials: [],
    optionalCredentials: ["botToken"],
  },
  {
    provider: "whatsapp",
    label: "WhatsApp",
    requiredCredentials: [],
    optionalCredentials: ["accessToken", "phoneNumberId"],
  },
];

function getCredentialKeys(
  provider?: ChannelProviderCapabilities | null,
): string[] {
  if (!provider) {
    return [];
  }

  return Array.from(
    new Set([...provider.requiredCredentials, ...provider.optionalCredentials]),
  );
}

function toChannelCredentials(form: ChannelFormState): Record<string, string> {
  return Object.fromEntries(
    Object.entries(form.credentials).filter((entry) => entry[1].trim().length > 0),
  );
}

function humanizeCredentialKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const { locale, setLocale, t } = useTranslation();
  const { setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
  const [settings, setSettings] = useState<UserSettings>(() => readSettings());

  const [profile, setProfile] = useState<LinkedServerProfile | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusPayload | null>(null);

  const [serverPlugins, setServerPlugins] = useState<PluginManifest[]>([]);
  const [pluginCatalog, setPluginCatalog] = useState<PluginCatalogItem[]>([]);
  const [loadingPlugins, setLoadingPlugins] = useState(false);

  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [channelProviders, setChannelProviders] = useState<
    ChannelProviderCapabilities[]
  >(DEFAULT_CHANNEL_PROVIDERS);
  const [channelForm, setChannelForm] = useState<ChannelFormState>(
    INITIAL_CHANNEL_FORM,
  );
  const [loadingChannels, setLoadingChannels] = useState(false);

  const tabs = useMemo(() => buildSettingsTabs(t), [t]);

  const updateSettings = (update: UserSettingsUpdate) => {
    const next = writeSettings(update);
    setSettings(next);
  };

  const loadServerData = async (activeProfile: LinkedServerProfile) => {
    if (activeProfile.source === "local") {
      setHealth(null);
      setHealthError(null);
      setServerPlugins([]);
      setPluginCatalog([]);
      setChannels([]);
      setChannelProviders(DEFAULT_CHANNEL_PROVIDERS);
      setAgentStatus({
        enabled: false,
        provider: "local",
        model: "mino-local-demo",
      });
      return;
    }

    setLoadingPlugins(true);
    setLoadingChannels(true);

    const [
      healthResult,
      pluginsResult,
      catalogResult,
      channelsResult,
      providerResult,
      agentResult,
    ] = await Promise.allSettled([
      fetchHealth(activeProfile.serverUrl, activeProfile.apiKey),
      fetchPlugins(activeProfile.serverUrl, activeProfile.apiKey),
      fetchPluginCatalog(activeProfile.serverUrl, activeProfile.apiKey),
      fetchChannels(activeProfile.serverUrl, activeProfile.apiKey),
      fetchChannelProviders(activeProfile.serverUrl, activeProfile.apiKey),
      fetchAgentStatus(activeProfile.serverUrl, activeProfile.apiKey),
    ]);

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
      setHealthError(null);
    } else {
      setHealth(null);
      setHealthError(
        healthResult.reason instanceof Error
          ? healthResult.reason.message
          : t("settings.server.loadError"),
      );
    }

    if (pluginsResult.status === "fulfilled") {
      setServerPlugins(pluginsResult.value);
    } else {
      setServerPlugins([]);
    }

    if (catalogResult.status === "fulfilled") {
      setPluginCatalog(catalogResult.value);
    } else {
      setPluginCatalog([]);
    }

    if (channelsResult.status === "fulfilled") {
      setChannels(channelsResult.value);
    } else {
      setChannels([]);
    }

    if (providerResult.status === "fulfilled" && providerResult.value.length > 0) {
      setChannelProviders(providerResult.value);
    } else {
      setChannelProviders(DEFAULT_CHANNEL_PROVIDERS);
    }

    if (agentResult.status === "fulfilled") {
      setAgentStatus(agentResult.value);
    } else {
      setAgentStatus({
        enabled: false,
        provider: "unknown",
        model: "unknown",
      });
    }

    setLoadingPlugins(false);
    setLoadingChannels(false);
  };

  useEffect(() => {
    const initial = readSettings();
    setSettings(initial);
    if (initial.locale !== locale) {
      setLocale(initial.locale);
    }

    if (isSettingsTabId(requestedTab)) {
      setActiveTab(requestedTab);
    }

    const fallbackProfile = getFallbackProfile();
    setProfile(fallbackProfile);
    if (fallbackProfile) {
      void loadServerData(fallbackProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, requestedTab, setLocale, t]);

  useEffect(() => {
    setChannelForm((previous) => {
      const fallbackProvider = channelProviders[0];
      const resolvedProvider =
        channelProviders.find((entry) => entry.provider === previous.type) ??
        fallbackProvider;

      if (!resolvedProvider) {
        return previous;
      }

      const nextType = resolvedProvider.provider;
      const credentialKeys = getCredentialKeys(resolvedProvider);
      const nextCredentials = Object.fromEntries(
        credentialKeys.map((key) => [key, previous.credentials[key] ?? ""]),
      );

      const previousKeys = Object.keys(previous.credentials);
      const sameCredentialShape =
        previousKeys.length === credentialKeys.length &&
        credentialKeys.every(
          (key) => (previous.credentials[key] ?? "") === (nextCredentials[key] ?? ""),
        );

      if (previous.type === nextType && sameCredentialShape) {
        return previous;
      }

      return {
        ...previous,
        type: nextType,
        credentials: nextCredentials,
      };
    });
  }, [channelProviders]);

  const activeChannelProvider = useMemo(
    () =>
      channelProviders.find((providerEntry) => providerEntry.provider === channelForm.type) ??
      channelProviders[0] ??
      null,
    [channelForm.type, channelProviders],
  );

  const channelCredentialKeys = useMemo(
    () => getCredentialKeys(activeChannelProvider),
    [activeChannelProvider],
  );

  const missingRequiredChannelCredentials = useMemo(() => {
    if (!activeChannelProvider) {
      return false;
    }

    return activeChannelProvider.requiredCredentials.some(
      (key) => !(channelForm.credentials[key] ?? "").trim(),
    );
  }, [activeChannelProvider, channelForm.credentials]);

  const channelCredentialLabel = (key: string): string => {
    if (key === "botToken") {
      return t("settings.channels.botToken");
    }
    if (key === "accessToken") {
      return t("settings.channels.accessToken");
    }
    if (key === "phoneNumberId") {
      return t("settings.channels.phoneNumberId");
    }
    return humanizeCredentialKey(key);
  };

  const channelCredentialPlaceholder = (key: string): string => {
    if (key === "botToken") {
      return t("settings.channels.botTokenPlaceholder");
    }
    if (key === "accessToken") {
      return t("settings.channels.accessTokenPlaceholder");
    }
    if (key === "phoneNumberId") {
      return t("settings.channels.phoneNumberIdPlaceholder");
    }
    return `${humanizeCredentialKey(key)}...`;
  };

  const installedCatalogIds = new Set(serverPlugins.map((plugin) => plugin.id));
  const availableCatalog = pluginCatalog.filter(
    (entry) => !installedCatalogIds.has(entry.id),
  );

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
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t("settings.general.languageDesc")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map((option) => (
                <button
                  key={option}
                  className={`button-secondary text-xs ${
                    locale === option
                      ? "!border-[var(--purple-400)] !text-[var(--text-primary)]"
                      : ""
                  }`}
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
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t("settings.general.themeDesc")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                { key: "dark", label: t("settings.general.dark") },
                { key: "light", label: t("settings.general.light") },
                { key: "system", label: t("settings.general.system") },
              ] as const).map((themeOption) => (
                <button
                  key={themeOption.key}
                  className={`button-secondary text-xs ${
                    settings.theme === themeOption.key
                      ? "!border-[var(--purple-400)] !text-[var(--text-primary)]"
                      : ""
                  }`}
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
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t("settings.server.title")}
          </h2>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("settings.server.serverUrl")}
            </p>
            <p className="font-medium text-[var(--text-primary)]">
              {profile?.serverUrl ?? "-"}
            </p>
          </div>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("settings.server.status")}
            </p>
            <p className="font-medium text-[var(--text-primary)]">
              {profile
                ? healthError
                  ? t("settings.server.disconnected")
                  : t("settings.server.connected")
                : t("settings.server.disconnected")}
            </p>
            {health ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                {t("settings.server.lastVerified")}: v{health.version} ·{" "}
                {health.uptimeSeconds}s
              </p>
            ) : null}
            {healthError ? (
              <p className="mt-1 text-xs text-rose-300">{healthError}</p>
            ) : null}
          </div>

          <Link href="/link" className="button-primary inline-flex">
            {t("settings.server.relink")}
          </Link>
        </div>
      ) : null}

      {activeTab === "agent" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t("settings.agent.title")}
          </h2>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 text-sm">
            <p className="text-[var(--text-secondary)]">
              {t("settings.agent.runtimeStatus")}
            </p>
            <p className="mt-1 text-[var(--text-primary)]">
              {agentStatus
                ? `${agentStatus.provider} · ${agentStatus.model}`
                : t("settings.agent.statusUnknown")}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <span className="text-sm text-[var(--text-secondary)]">
              {t("settings.agent.enabled")}
            </span>
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
              <option value="anthropic/claude-sonnet-4-20250514">
                Claude Sonnet 4
              </option>
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
            <p className="mb-2 text-sm text-[var(--text-secondary)]">
              {t("settings.agent.permissions")}
            </p>
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
                    className={`toggle-switch ${
                      settings.agent.permissions[permission.key] ? "active" : ""
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      updateSettings({
                        agent: {
                          ...settings.agent,
                          permissions: {
                            ...settings.agent.permissions,
                            [permission.key]:
                              !settings.agent.permissions[permission.key],
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

      {activeTab === "channels" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t("settings.channels.title")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("settings.channels.subtitle")}
          </p>

          <div className="grid gap-3 rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
            <label className="text-sm text-[var(--text-secondary)]">
              {t("settings.channels.provider")}
              <select
                className="field mt-2"
                value={channelForm.type}
                onChange={(event) => {
                  const nextType = event.target.value as ChannelProvider;
                  const nextProvider =
                    channelProviders.find((entry) => entry.provider === nextType) ??
                    channelProviders[0] ??
                    null;
                  const credentialKeys = getCredentialKeys(nextProvider);

                  setChannelForm((prev) => ({
                    ...prev,
                    type: nextType,
                    credentials: Object.fromEntries(
                      credentialKeys.map((key) => [key, prev.credentials[key] ?? ""]),
                    ),
                  }));
                }}
              >
                {channelProviders.map((providerOption) => (
                  <option key={providerOption.provider} value={providerOption.provider}>
                    {providerOption.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[var(--text-secondary)]">
              {t("settings.channels.name")}
              <input
                className="field mt-2"
                value={channelForm.name}
                onChange={(event) =>
                  setChannelForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t("settings.channels.namePlaceholder")}
              />
            </label>

            <label className="text-sm text-[var(--text-secondary)]">
              {t("settings.channels.webhookSecret")}
              <input
                className="field mt-2"
                value={channelForm.webhookSecret}
                onChange={(event) =>
                  setChannelForm((prev) => ({
                    ...prev,
                    webhookSecret: event.target.value,
                  }))
                }
                placeholder={t("settings.channels.webhookSecretPlaceholder")}
              />
            </label>

            {channelCredentialKeys.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-[var(--text-tertiary)]">
                No provider credentials required for this channel.
              </p>
            ) : (
              <div className="grid gap-3">
                {channelCredentialKeys.map((key) => {
                  const isRequired =
                    activeChannelProvider?.requiredCredentials.includes(key) ?? false;

                  return (
                    <label key={key} className="text-sm text-[var(--text-secondary)]">
                      {channelCredentialLabel(key)}
                      {isRequired ? (
                        <span className="ml-1 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                          Required
                        </span>
                      ) : null}
                      <input
                        className="field mt-2"
                        value={channelForm.credentials[key] ?? ""}
                        onChange={(event) =>
                          setChannelForm((prev) => ({
                            ...prev,
                            credentials: {
                              ...prev.credentials,
                              [key]: event.target.value,
                            },
                          }))
                        }
                        placeholder={channelCredentialPlaceholder(key)}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            <button
              className="button-primary mt-2"
              disabled={
                !profile ||
                profile.source === "local" ||
                missingRequiredChannelCredentials
              }
              onClick={async () => {
                if (!profile || profile.source === "local") return;
                if (!channelForm.name.trim()) return;
                if (missingRequiredChannelCredentials) return;

                const created = await upsertChannelOnServer(
                  profile.serverUrl,
                  profile.apiKey,
                  {
                    type: channelForm.type,
                    name: channelForm.name.trim(),
                    webhookSecret: channelForm.webhookSecret.trim(),
                    credentials: toChannelCredentials(channelForm),
                  },
                );

                setChannels((prev) => [...prev, created]);
                setChannelForm(INITIAL_CHANNEL_FORM);
              }}
            >
              {t("settings.channels.add")}
            </button>
            {missingRequiredChannelCredentials ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                Fill all required credentials before adding this channel.
              </p>
            ) : null}
          </div>

          {loadingChannels ? (
            <div className="animate-pulse text-sm text-[var(--text-tertiary)] py-2">
              {t("settings.channels.loading")}
            </div>
          ) : channels.length === 0 ? (
            <div className="rounded-mino-lg border border-dashed border-white/10 p-6 text-sm text-[var(--text-tertiary)]">
              {t("settings.channels.empty")}
            </div>
          ) : (
            <div className="grid gap-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {channel.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {channel.type} ·{" "}
                        {channel.enabled
                          ? t("settings.channels.enabled")
                          : t("settings.channels.disabled")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`toggle-switch ${channel.enabled ? "active" : ""}`}
                        onClick={async () => {
                          if (!profile || profile.source === "local") return;
                          const updated = await toggleChannelOnServer(
                            profile.serverUrl,
                            profile.apiKey,
                            channel.id,
                            !channel.enabled,
                          );
                          setChannels((prev) =>
                            prev.map((entry) =>
                              entry.id === updated.id ? updated : entry,
                            ),
                          );
                        }}
                      />
                      <button
                        className="button-secondary text-xs"
                        onClick={async () => {
                          if (!profile || profile.source === "local") return;
                          await deleteChannelOnServer(
                            profile.serverUrl,
                            profile.apiKey,
                            channel.id,
                          );
                          setChannels((prev) =>
                            prev.filter((entry) => entry.id !== channel.id),
                          );
                        }}
                      >
                        {t("settings.channels.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "plugins" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t("settings.plugins.title")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("settings.plugins.subtitle")}
          </p>

          {loadingPlugins ? (
            <div className="animate-pulse text-sm text-[var(--text-tertiary)] py-4">
              {t("settings.plugins.loading")}
            </div>
          ) : serverPlugins.length > 0 ? (
            <div className="grid gap-2">
              {serverPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {plugin.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {plugin.description || `v${plugin.version}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className={`toggle-switch ${plugin.enabled ? "active" : ""}`}
                      onClick={async () => {
                        if (!profile) return;
                        const updated = await togglePluginOnServer(
                          profile.serverUrl,
                          profile.apiKey,
                          plugin.id,
                          !plugin.enabled,
                        );
                        setServerPlugins((prev) =>
                          prev.map((entry) =>
                            entry.id === updated.id ? updated : entry,
                          ),
                        );
                      }}
                    />
                    <button
                      className="button-secondary text-xs"
                      onClick={async () => {
                        if (!profile) return;
                        const keyInput = window.prompt(
                          t("settings.plugins.apiKeyPrompt"),
                          typeof plugin.config?.apiKey === "string"
                            ? plugin.config.apiKey
                            : "",
                        );
                        if (keyInput === null) return;
                        const updated = await updatePluginConfigOnServer(
                          profile.serverUrl,
                          profile.apiKey,
                          plugin.id,
                          {
                            apiKey: keyInput.trim(),
                          },
                        );
                        setServerPlugins((prev) =>
                          prev.map((entry) =>
                            entry.id === updated.id ? updated : entry,
                          ),
                        );
                      }}
                    >
                      {t("settings.plugins.configure")}
                    </button>
                    <button
                      className="button-secondary text-xs"
                      onClick={async () => {
                        if (!profile) return;
                        await uninstallPluginOnServer(
                          profile.serverUrl,
                          profile.apiKey,
                          plugin.id,
                        );
                        setServerPlugins((prev) =>
                          prev.filter((entry) => entry.id !== plugin.id),
                        );
                        setPluginCatalog((prev) =>
                          prev.map((entry) =>
                            entry.id === plugin.id
                              ? {
                                  ...entry,
                                  installed: false,
                                  enabled: false,
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      {t("settings.plugins.uninstall")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-mino-lg border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("settings.plugins.emptyServerTitle")}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {t("settings.plugins.emptyServerHint")}
              </p>
            </div>
          )}

          {availableCatalog.length > 0 ? (
            <section className="mt-6">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                {t("settings.plugins.availableCatalog")}
              </h3>
              <div className="grid gap-2">
                {availableCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)]/40 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                    <button
                      className="button-primary text-xs"
                      onClick={async () => {
                        if (!profile) return;
                        const installed = await installPluginOnServer(
                          profile.serverUrl,
                          profile.apiKey,
                          item.id,
                        );
                        setServerPlugins((prev) => [...prev, installed]);
                      }}
                    >
                      {t("settings.plugins.install")}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              {t("settings.plugins.localInterfaceTitle")}
            </h3>
            <div className="grid gap-2">
              {PLUGIN_REGISTRY.map((plugin) => {
                const enabled = isPluginEnabled(
                  plugin.id,
                  settings.enabledPlugins,
                );
                return (
                  <div
                    key={plugin.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)]/40 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {plugin.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {plugin.description}
                      </p>
                    </div>
                    <button
                      className={`toggle-switch ${enabled ? "active" : ""}`}
                      onClick={() =>
                        updateSettings({
                          enabledPlugins: togglePlugin(
                            plugin.id,
                            settings.enabledPlugins,
                          ),
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "about" ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t("settings.about.title")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("settings.about.description")}
          </p>

          <div className="rounded-mino-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 text-sm">
            <p className="text-[var(--text-secondary)]">
              {t("settings.about.version")}
            </p>
            <p className="font-medium text-[var(--text-primary)]">0.1.0</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href="https://github.com/mino-ink"
              target="_blank"
              rel="noreferrer"
              className="button-secondary text-sm"
            >
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
