"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LinkStatusCard } from "@/components/link-status-card";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslation } from "@/components/i18n-provider";
import { runLinkFlow, type LinkStep } from "@/lib/linking";
import type { TranslationKey } from "@/lib/i18n";
import { exchangeRelayCode } from "@/lib/relay";
import { parseLinkParams, removeSensitiveQueryParams } from "@/lib/url";

const STEP_LABEL_KEY: Record<LinkStep, TranslationKey> = {
  resolving: "link.steps.resolving",
  validating: "link.steps.validating",
  verifying: "link.steps.verifying",
  linking: "link.steps.linking",
  persisting: "link.steps.persisting",
  done: "link.steps.done",
};

export default function LinkPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<LinkStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const parsed = parseLinkParams(search);
    const sanitized = removeSensitiveQueryParams(window.location.pathname, search);
    const current = `${window.location.pathname}${window.location.search}`;

    if (sanitized !== current) {
      window.history.replaceState(null, "", sanitized);
    }

    if (parsed.serverUrl) {
      setServerUrl(parsed.serverUrl);
    }
    if (parsed.apiKey) {
      setApiKey(parsed.apiKey);
    }
    if (parsed.name) {
      setName(parsed.name);
    }

    if (parsed.serverUrl && parsed.apiKey) {
      void startLinking(parsed.serverUrl, parsed.apiKey, parsed.name, "link");
    } else if (parsed.relayCode) {
      void startRelayLinking(parsed.relayCode, parsed.relayUrl, parsed.name);
    } else {
      setAutoAttempted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startLinking(
    nextServerUrl: string,
    nextApiKey: string,
    nextName: string | undefined,
    source: "link" | "manual" | "local" | "relay",
  ) {
    setError(null);
    setBusy(true);

    try {
      const result = await runLinkFlow({
        serverUrl: nextServerUrl,
        apiKey: nextApiKey,
        name: nextName,
        source,
        onStep: setStep,
      });

      router.replace(`/workspace?profile=${encodeURIComponent(result.profile.id)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("link.errors.failedToLink"));
      setAutoAttempted(true);
      setStep(null);
    } finally {
      setBusy(false);
    }
  }

  async function startRelayLinking(
    relayCode: string,
    relayUrl: string | undefined,
    nextName: string | undefined,
  ) {
    setError(null);
    setBusy(true);
    setStep("resolving");

    try {
      const exchanged = await exchangeRelayCode(relayCode, relayUrl);
      setServerUrl(exchanged.serverUrl);
      setApiKey(exchanged.apiKey);
      await startLinking(exchanged.serverUrl, exchanged.apiKey, nextName, "relay");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("link.errors.failedToExchangeRelay"));
      setAutoAttempted(true);
      setStep(null);
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await startLinking(serverUrl, apiKey, name || undefined, "manual");
  }

  const description = useMemo(() => {
    if (busy && step) {
      return `${t(STEP_LABEL_KEY[step])}...`;
    }

    if (error) {
      return error;
    }

    return t("link.description");
  }, [busy, error, step, t]);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="glass-card flex items-center justify-between rounded-full px-4 py-3 md:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link href="/" className="button-secondary text-sm">
              {t("nav.home")}
            </Link>
            <Link href="/docs" className="button-secondary text-sm">
              {t("nav.docs")}
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-xl">
          <LinkStatusCard title={t("link.title")} description={description}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="server-url" className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  {t("link.fields.serverUrl")}
                </label>
                <input
                  id="server-url"
                  className="field"
                  type="text"
                  value={serverUrl}
                  onChange={(event) => setServerUrl(event.target.value)}
                  placeholder={t("link.fields.serverUrlPlaceholder")}
                  autoComplete="url"
                  required
                />
              </div>

              <div>
                <label htmlFor="api-key" className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  {t("link.fields.apiKey")}
                </label>
                <input
                  id="api-key"
                  className="field"
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={t("link.fields.apiKeyPlaceholder")}
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-name" className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  {t("link.fields.profileName")}
                </label>
                <input
                  id="profile-name"
                  className="field"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("link.fields.profileNamePlaceholder")}
                />
              </div>

              <button className="button-primary w-full" type="submit" disabled={busy}>
                {busy ? t("link.submitting") : t("link.submit")}
              </button>
            </form>

            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
            {autoAttempted && !busy && !error ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                {t("link.noPrefill")}
              </p>
            ) : null}
          </LinkStatusCard>
        </div>
      </div>
    </main>
  );
}
