"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n-provider";
import { Sidebar } from "@/components/workspace/sidebar";
import { NoteList } from "@/components/workspace/note-list";
import { NoteEditor } from "@/components/workspace/note-editor";
import { AgentChatPanel } from "@/components/workspace/agent-chat-panel";
import { CommandPalette } from "@/components/workspace/command-palette";
import {
  fetchHealth,
  fetchNotes,
  createNote,
  moveNote,
  type HealthPayload,
  type NoteSummary,
} from "@/lib/api";
import {
  getFallbackProfile,
  getLocalDemoProfile,
  getProfileById,
  getProfiles,
  setActiveProfile,
  type LinkedServerProfile,
} from "@/lib/storage";

function isTextInputTarget(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [profiles, setProfiles] = useState<LinkedServerProfile[]>([]);
  const [profile, setProfile] = useState<LinkedServerProfile | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const resolveInitialProfile = useCallback((): LinkedServerProfile | null => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("profile");
    const mode = params.get("mode");
    const linkedProfiles = getProfiles();
    setProfiles(linkedProfiles);

    if (mode === "local") {
      return getLocalDemoProfile();
    }

    const fromQuery = profileId ? getProfileById(profileId) : null;
    const fallback = fromQuery ?? getFallbackProfile();
    if (fallback) {
      setActiveProfile(fallback.id);
    }
    return fallback;
  }, []);

  useEffect(() => {
    const selected = resolveInitialProfile();
    if (!selected) {
      router.replace("/link");
      return;
    }
    setProfile(selected);
  }, [resolveInitialProfile, router]);

  useEffect(() => {
    if (!profile) return;

    async function loadData(activeProfile: LinkedServerProfile) {
      try {
        setLoading(true);
        setError(null);
        setSelectedNote(null);

        if (activeProfile.source === "local") {
          await new Promise((resolve) => setTimeout(resolve, 250));

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
          setSelectedNote(mockNotes[0] ?? null);
          return;
        }

        const [healthData, notesData] = await Promise.all([
          fetchHealth(activeProfile.serverUrl, activeProfile.apiKey),
          fetchNotes(activeProfile.serverUrl, activeProfile.apiKey),
        ]);

        setHealth(healthData);
        setNotes(notesData);
        setSelectedNote(notesData[0] ?? null);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : t("workspace.errors.loadData"),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData(profile);
  }, [profile, t]);

  const handleProfileSelect = async (profileId: string) => {
    if (profile?.source === "local" && profile.id === profileId) {
      return;
    }

    const linkedProfile = setActiveProfile(profileId);
    if (!linkedProfile) {
      return;
    }

    setProfile(linkedProfile);
    router.replace(`/workspace?profile=${encodeURIComponent(linkedProfile.id)}`);
  };

  const handleNewNote = async () => {
    if (!profile) return;

    const name = window.prompt(
      t("workspace.prompts.noteName"),
      t("workspace.prompts.defaultNoteName"),
    );
    if (!name) return;

    const path = name.endsWith(".md") ? name : `${name}.md`;
    const title = name.replace(/\.md$/i, "").trim() || "Untitled";

    if (profile.source === "local") {
      const now = new Date().toISOString();
      const localNote: NoteSummary = {
        path,
        title,
        tags: [],
        wordCount: 0,
        updatedAt: now,
      };
      setNotes((prev) => [localNote, ...prev]);
      setSelectedNote(localNote);
      return;
    }

    try {
      setLoading(true);
      const created = await createNote(
        profile.serverUrl,
        profile.apiKey,
        path,
        `# ${title}\n\n${t("workspace.noteEditor.startWriting")}`,
      );

      const updatedNotes = await fetchNotes(profile.serverUrl, profile.apiKey);
      setNotes(updatedNotes);
      setSelectedNote(created);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("workspace.errors.createNote"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMoveNote = async (fromPath: string, targetFolderPath: string) => {
    if (!profile) return;

    const fileName = fromPath.split("/").pop();
    if (!fileName) return;

    const destinationPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName;
    if (destinationPath === fromPath) {
      return;
    }

    if (profile.source === "local") {
      const now = new Date().toISOString();
      setNotes((prev) =>
        prev.map((note) =>
          note.path === fromPath
            ? {
                ...note,
                path: destinationPath,
                updatedAt: now,
              }
            : note,
        ),
      );
      setSelectedNote((prev) =>
        prev && prev.path === fromPath
          ? {
              ...prev,
              path: destinationPath,
              updatedAt: now,
            }
          : prev,
      );
      return;
    }

    try {
      const moved = await moveNote(
        profile.serverUrl,
        profile.apiKey,
        fromPath,
        destinationPath,
      );
      const refreshed = await fetchNotes(profile.serverUrl, profile.apiKey);
      setNotes(refreshed);
      setSelectedNote((prev) => (prev?.path === fromPath ? moved : prev));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("workspace.errors.loadData"),
      );
    }
  };

  const statusTone = useMemo(() => {
    if (error) return "error";
    if (health?.status === "ok") return "ok";
    return "warn";
  }, [error, health?.status]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const treeVersion = useMemo(
    () => notes.map((note) => `${note.path}:${note.updatedAt}`).join("|"),
    [notes],
  );

  const filteredNotes = useMemo(() => {
    if (!normalizedSearch) {
      return notes;
    }

    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(normalizedSearch) ||
        note.path.toLowerCase().includes(normalizedSearch) ||
        note.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [normalizedSearch, notes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const metaOrCtrl = event.metaKey || event.ctrlKey;

      if (metaOrCtrl && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (metaOrCtrl && event.key.toLowerCase() === "n") {
        event.preventDefault();
        void handleNewNote();
        return;
      }

      if (metaOrCtrl && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setChatOpen((prev) => !prev);
        return;
      }

      if (metaOrCtrl && event.key === ",") {
        event.preventDefault();
        router.push("/settings?tab=server");
        return;
      }

      if (event.key === "Escape" && commandPaletteOpen) {
        event.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }

      if (
        !metaOrCtrl &&
        !commandPaletteOpen &&
        !isTextInputTarget(event) &&
        event.key.length === 1 &&
        !event.altKey
      ) {
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, handleNewNote, router]);

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-mino-base">
      <div className="mino-grid-overlay opacity-20" />

      <div className="relative z-20 flex flex-1 overflow-hidden">
        <Sidebar
          noteCount={filteredNotes.length}
          treeVersion={treeVersion}
          onNewNote={handleNewNote}
          profileName={profile?.name}
          profile={profile}
          profiles={profiles}
          onSelectProfile={handleProfileSelect}
          onOpenSettings={() => router.push("/settings?tab=server")}
          onConnectServer={() => router.push("/link")}
          onSelectNote={(path) => {
            const note = notes.find((entry) => entry.path === path);
            if (note) {
              setSelectedNote(note);
            }
          }}
          onMoveNote={handleMoveNote}
        />
        <NoteList
          notes={filteredNotes}
          loading={loading}
          selectedPath={selectedNote?.path}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectNote={(note) => setSelectedNote(note)}
        />
        <NoteEditor
          profile={profile}
          noteSummary={selectedNote}
          onSave={(updated) => {
            setNotes((prev) =>
              prev.map((entry) => (entry.path === updated.path ? updated : entry)),
            );
          }}
        />
        <AgentChatPanel
          profile={profile}
          selectedNotePath={selectedNote?.path}
          open={chatOpen}
          onToggle={() => setChatOpen((prev) => !prev)}
        />
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        notes={notes}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenNote={(note) => {
          setSelectedNote(note);
        }}
        onCreateNote={handleNewNote}
        onToggleAgent={() => setChatOpen((prev) => !prev)}
        onOpenSettings={() => router.push("/settings?tab=server")}
      />

      <div className="relative z-30 flex h-8 items-center justify-between border-t border-white/5 bg-mino-surface/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusTone === "ok"
                  ? "bg-success"
                  : statusTone === "error"
                    ? "bg-error"
                    : "bg-warning"
              }`}
            />
            {profile?.name ?? t("workspace.statusBar.defaultServerName")}
          </div>
          {health ? <span>v{health.version}</span> : null}
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          {health ? (
            <span>
              {t("workspace.statusBar.uptime", {
                seconds: health.uptimeSeconds,
              })}
            </span>
          ) : null}
          <button
            className="hover:text-white transition-colors"
            onClick={() => setChatOpen((prev) => !prev)}
          >
            {chatOpen ? t("workspace.statusBar.hideAgent") : t("workspace.statusBar.openAgent")}
          </button>
        </div>
      </div>
    </main>
  );
}
