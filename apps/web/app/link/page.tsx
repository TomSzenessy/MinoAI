"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LinkStatusCard } from "@/components/link-status-card";
import { BrandLogo } from "@/components/brand-logo";
import { runLinkFlow, type LinkStep } from "@/lib/linking";
import { exchangeRelayCode } from "@/lib/relay";
import { parseLinkParams, removeSensitiveQueryParams } from "@/lib/url";

const STEP_LABEL: Record<LinkStep, string> = {
  resolving: "Resolving relay code",
  validating: "Validating URL",
  verifying: "Verifying API key",
  linking: "Linking server",
  persisting: "Saving profile",
  done: "Done",
};

export default function LinkPage() {
  const router = useRouter();
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
      setError(caught instanceof Error ? caught.message : "Failed to link server.");
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
      setError(caught instanceof Error ? caught.message : "Failed to exchange relay code.");
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
      return `${STEP_LABEL[step]}...`;
    }

    if (error) {
      return error;
    }

    return "Use a prefilled URL or enter server details manually.";
  }, [busy, error, step]);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="glass-card flex items-center justify-between rounded-full px-4 py-3 md:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link href="/" className="button-secondary text-sm">
              Home
            </Link>
            <Link href="/docs" className="button-secondary text-sm">
              Docs
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-xl">
          <LinkStatusCard title="Link Your Server" description={description}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="server-url" className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  Server URL
                </label>
                <input
                  id="server-url"
                  className="field"
                  type="text"
                  value={serverUrl}
                  onChange={(event) => setServerUrl(event.target.value)}
                  placeholder="https://your-server.example"
                  autoComplete="url"
                  required
                />
              </div>

              <div>
                <label htmlFor="api-key" className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  API Key
                </label>
                <input
                  id="api-key"
                  className="field"
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="mino_sk_..."
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-name" className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  Profile Name (optional)
                </label>
                <input
                  id="profile-name"
                  className="field"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Personal Server"
                />
              </div>

              <button className="button-primary w-full" type="submit" disabled={busy}>
                {busy ? "Linking..." : "Link Server"}
              </button>
            </form>

            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
            {autoAttempted && !busy && !error ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                No prefilled credentials were found in the URL. Paste server details above.
              </p>
            ) : null}
          </LinkStatusCard>
        </div>
      </div>
    </main>
  );
}
