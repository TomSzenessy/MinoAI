"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n-provider";
import { Sidebar } from "@/components/workspace/sidebar";
import { NoteList } from "@/components/workspace/note-list";
import { NoteEditor } from "@/components/workspace/note-editor";
import {
  fetchHealth,
  fetchNotes,
  createNote,
  type HealthPayload,
  type NoteSummary,
} from "@/lib/api";
import {
  getActiveProfile,
  getLocalDemoProfile,
  getProfileById,
  type LinkedServerProfile,
  LOCAL_PROFILE_ID,
} from "@/lib/storage";

export default function WorkspacePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<LinkedServerProfile | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("profile");
    const mode = params.get("mode");

    let selectedProfile: LinkedServerProfile | null = null;

    if (mode === "local") {
      selectedProfile = getLocalDemoProfile();
    } else {
      selectedProfile = profileId
        ? getProfileById(profileId)
        : getActiveProfile();
    }

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

        if (activeProfile.source === "local") {
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 800));

          const mockHealth: HealthPayload = {
            status: "ok",
            version: "0.1.0-local",
            uptimeSeconds: 0,
            noteCount: 4,
            lastIndexedAt: new Date().toISOString(),
          };

          const mockNotes: NoteSummary[] = [
            {
              title: "Welcome to Mino",
              path: "welcome.md",
              tags: ["guide", "getting-started"],
              wordCount: 42,
              updatedAt: new Date().toISOString(),
            },
            {
              title: "Local Mode Guide",
              path: "guides/local-mode.md",
              tags: ["help"],
              wordCount: 156,
              updatedAt: new Date().toISOString(),
            },
            {
              title: "Project: Agent Native",
              path: "projects/agent-native.md",
              tags: ["architecture", "planning"],
              wordCount: 890,
              updatedAt: new Date().toISOString(),
            },
            {
              title: "Meeting Notes - Feb 13",
              path: "daily/2026-02-13.md",
              tags: ["meeting"],
              wordCount: 234,
              updatedAt: new Date().toISOString(),
            },
          ];

          setHealth(mockHealth);
          setNotes(mockNotes);
          const firstMockNote = mockNotes[0];
          if (firstMockNote && !selectedNote) {
            setSelectedNote(firstMockNote);
          }
        } else {
          const [healthData, notesData] = await Promise.all([
            fetchHealth(activeProfile.serverUrl, activeProfile.apiKey),
            fetchNotes(activeProfile.serverUrl, activeProfile.apiKey),
          ]);

          setHealth(healthData);
          setNotes(notesData);
          const firstNote = notesData[0];
          if (firstNote && !selectedNote) {
            setSelectedNote(firstNote);
          }
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : t("workspace.errors.loadData"),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [router, t]);

  const handleNewNote = async () => {
    if (!profile) return;

    const name = window.prompt(
      t("workspace.prompts.noteName"),
      t("workspace.prompts.defaultNoteName"),
    );
    if (!name) return;

    const path = name.endsWith(".md") ? name : `${name}.md`;

    try {
      setLoading(true);
      const newNote = await createNote(
        profile.serverUrl,
        profile.apiKey,
        path,
        `# ${name.replace(".md", "")}\n\n${t("workspace.noteEditor.startWriting")}`,
      );

      // Refresh the list
      const updatedNotes = await fetchNotes(profile.serverUrl, profile.apiKey);
      setNotes(updatedNotes);
      setSelectedNote(newNote);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("workspace.errors.createNote"),
      );
    } finally {
      setLoading(false);
    }
  };

  const statusTone = useMemo(() => {
    if (error) return "error";
    if (health?.status === "ok") return "ok";
    return "warn";
  }, [error, health?.status]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-mino-base flex flex-col">
      <div className="mino-grid-overlay opacity-20" />

      <div className="relative z-20 flex-1 flex overflow-hidden">
        <Sidebar
          noteCount={notes.length}
          onNewNote={handleNewNote}
          profileName={profile?.name}
          profile={profile}
          onSelectNote={(path) => {
            const note = notes.find((n) => n.path === path);
            if (note) setSelectedNote(note);
          }}
        />
        <NoteList
          notes={notes}
          loading={loading}
          selectedPath={selectedNote?.path}
          onSelectNote={(note) => setSelectedNote(note)}
        />
        <NoteEditor
          profile={profile}
          noteSummary={selectedNote}
          onSave={(updated) => {
            // Update the title in the list if it changed
            setNotes((prev) =>
              prev.map((n) => (n.path === updated.path ? updated : n)),
            );
          }}
        />
      </div>

      <div className="relative z-30 h-8 border-t border-white/5 bg-mino-surface/80 backdrop-blur-md flex items-center justify-between px-4">
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusTone === "ok" ? "bg-success" : statusTone === "error" ? "bg-error" : "bg-warning"}`}
            />
            {profile?.name ?? t("workspace.statusBar.defaultServerName")}
          </div>
          {health && <span>v{health.version}</span>}
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-[var(--text-tertiary)]">
          {health ? (
            <span>
              {t("workspace.statusBar.uptime", {
                seconds: health.uptimeSeconds,
              })}
            </span>
          ) : null}
          <Link href="/settings" className="hover:text-white transition-colors">
            {t("workspace.statusBar.settings")}
          </Link>
        </div>
      </div>
    </main>
  );
}
