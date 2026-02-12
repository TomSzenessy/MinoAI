"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { StatusPill } from "@/components/status-pill";
import { fetchHealth, fetchNotes, type HealthPayload, type NoteSummary } from "@/lib/api";
import { getActiveProfile, getProfileById, type LinkedServerProfile } from "@/lib/storage";

export default function WorkspacePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<LinkedServerProfile | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("profile");
    const selectedProfile = profileId ? getProfileById(profileId) : getActiveProfile();

    if (!selectedProfile) {
      router.replace("/link");
      return;
    }

    const activeProfile = selectedProfile;
    setProfile(activeProfile);

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [healthData, notesData] = await Promise.all([
          fetchHealth(activeProfile.serverUrl, activeProfile.apiKey),
          fetchNotes(activeProfile.serverUrl, activeProfile.apiKey),
        ]);

        setHealth(healthData);
        setNotes(notesData);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load workspace data.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [router]);

  const statusTone = useMemo(() => {
    if (error) {
      return "error" as const;
    }

    if (health?.status === "ok") {
      return "ok" as const;
    }

    return "warn" as const;
  }, [error, health?.status]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 md:px-6">
      <div className="mino-grid-overlay" />

      <div className="relative flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-mino-2xl border border-[rgba(255,255,255,0.08)] bg-[var(--bg-surface)]/95">
        <header className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-3 md:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <StatusPill
              label={error ? "Disconnected" : health ? `Server ${health.status}` : "Connecting"}
              tone={statusTone}
            />
            <Link href="/link" className="button-secondary text-sm">
              Re-link
            </Link>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[260px_1fr]">
          <aside className="hidden border-r border-[rgba(255,255,255,0.06)] p-4 md:block">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Server</h2>
            <div className="glass-card rounded-mino-lg p-3">
              <p className="font-medium text-[var(--text-primary)]">{profile?.name ?? "Linked Server"}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{profile?.serverUrl}</p>
            </div>

            <h3 className="mb-2 mt-6 text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Notes</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {loading ? "Loading note index..." : `${notes.length} indexed notes`}
            </p>
          </aside>

          <section className="min-h-0 overflow-y-auto p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">Workspace</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {health ? `v${health.version} · ${health.uptimeSeconds}s uptime` : "Waiting for server"}
              </p>
            </div>

            {error ? (
              <div className="glass-card rounded-mino-xl p-4 text-sm text-rose-300">{error}</div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(loading ? [] : notes).slice(0, 12).map((note) => (
                <article
                  key={note.path}
                  className="rounded-mino-xl border border-[rgba(255,255,255,0.06)] bg-[var(--bg-elevated)] p-4"
                >
                  <h2 className="mb-2 font-display text-lg font-semibold text-[var(--text-primary)]">{note.title}</h2>
                  <p className="mb-3 text-xs text-[var(--text-secondary)]">{note.path}</p>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={`${note.path}-${tag}`}
                        className="rounded-full bg-[rgba(187,134,252,0.15)] px-2 py-0.5 text-xs text-[var(--purple-200)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {!loading && notes.length === 0 ? (
              <div className="glass-card mt-4 rounded-mino-xl p-4 text-sm text-[var(--text-secondary)]">
                No notes yet. Create your first markdown note through API or upcoming editor actions.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
