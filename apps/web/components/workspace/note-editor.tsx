"use client";

import { fetchNoteDetail, Note, NoteSummary, updateNote } from "@/lib/api";
import { useTranslation } from "@/components/i18n-provider";
import { LinkedServerProfile } from "@/lib/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "@/components/workspace/markdown-editor";

interface NoteEditorProps {
  profile: LinkedServerProfile | null;
  noteSummary: NoteSummary | null;
  onSave?: (note: Note) => void;
}

interface TitleBodyDraft {
  title: string;
  body: string;
}

function splitTitleAndBody(markdown: string, fallbackTitle: string): TitleBodyDraft {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const titleMatch = normalized.match(/^#\s+(.+?)\s*(?:\n|$)/);

  if (!titleMatch) {
    return {
      title: fallbackTitle,
      body: normalized,
    };
  }

  const title = titleMatch[1]?.trim() || fallbackTitle;
  const body = normalized.slice(titleMatch[0].length).replace(/^\n+/, "");
  return { title, body };
}

function composeMarkdown(title: string, body: string): string {
  const safeTitle = title.trim() || "Untitled";
  const cleanedBody = body.replace(/^\n+/, "");
  return cleanedBody.length > 0
    ? `# ${safeTitle}\n\n${cleanedBody}`
    : `# ${safeTitle}\n`;
}

export function NoteEditor({ profile, noteSummary, onSave }: NoteEditorProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef<Note | null>(null);
  const draftRef = useRef<TitleBodyDraft>({ title: "", body: "" });
  const profileRef = useRef<LinkedServerProfile | null>(profile);
  const bodyInputRef = useRef<MarkdownEditorHandle | null>(null);

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!profile || !noteSummary) {
      setNote(null);
      setTitle("");
      setBody("");
      draftRef.current = { title: "", body: "" };
      return;
    }

    if (profile.source === "local") {
      const localDraft = {
        title: noteSummary.title,
        body: t("workspace.localDemo.noteBody"),
      };
      setNote({
        ...noteSummary,
        content: composeMarkdown(localDraft.title, localDraft.body),
        frontmatter: {},
      });
      setTitle(localDraft.title);
      setBody(localDraft.body);
      draftRef.current = localDraft;
      return;
    }

    const activeProfile = profile;
    const activeSummary = noteSummary;

    async function loadNote() {
      try {
        setLoading(true);
        const detail = await fetchNoteDetail(
          activeProfile.serverUrl,
          activeProfile.apiKey,
          activeSummary.path,
        );
        const parsed = splitTitleAndBody(detail.content, detail.title);
        setNote(detail);
        setTitle(parsed.title);
        setBody(parsed.body);
        draftRef.current = parsed;
        setLastSaved(null);
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadNote();
  }, [profile, noteSummary, t]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const scheduleSave = (nextDraft: TitleBodyDraft) => {
    const activeProfile = profileRef.current;
    const activeNote = noteRef.current;
    if (!activeProfile || activeProfile.source === "local" || !activeNote) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updated = await updateNote(
          activeProfile.serverUrl,
          activeProfile.apiKey,
          activeNote.path,
          composeMarkdown(nextDraft.title, nextDraft.body),
        );
        setNote(updated);
        setLastSaved(new Date());
        onSave?.(updated);
      } catch (err) {
        console.error("Failed to save note:", err);
      } finally {
        setSaving(false);
      }
    }, 700);
  };

  const commitDraft = (patch: Partial<TitleBodyDraft>) => {
    const nextDraft: TitleBodyDraft = {
      ...draftRef.current,
      ...patch,
    };
    draftRef.current = nextDraft;
    setTitle(nextDraft.title);
    setBody(nextDraft.body);
    scheduleSave(nextDraft);
  };

  const bodyWordCount = useMemo(() => {
    const combined = `${title}\n${body}`;
    return combined.split(/\s+/).filter(Boolean).length;
  }, [body, title]);

  if (!noteSummary) {
    return (
      <div className="flex flex-1 items-center justify-center bg-mino-base">
        <div className="animate-fade-up text-center">
          <div className="mb-4 text-4xl opacity-20">✦</div>
          <h2 className="text-lg font-bold text-[var(--text-tertiary)]">
            {t("nav.selectNote")}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            {t("nav.autoSync")}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-mino-base">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          {t("workspace.noteEditor.loadingContent")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-mino-base">
      <div className="flex items-center justify-between border-b border-white/5 bg-mino-surface/20 p-4">
        <div className="flex items-center gap-4">
          <button className="text-[10px] text-[var(--text-tertiary)] transition-colors hover:text-white">
            {t("workspace.noteEditor.workspace")}
          </button>
          <span className="text-[10px] text-[var(--text-tertiary)]">/</span>
          <span className="max-w-[220px] truncate text-[10px] font-medium text-white">
            {noteSummary.path}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {saving ? (
            <span className="flex animate-pulse items-center gap-1.5 text-[10px] text-mino-purple">
              <span className="h-1.5 w-1.5 rounded-full bg-mino-purple" />
              {t("workspace.noteEditor.saving")}
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-[10px] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("workspace.noteEditor.savedAt", {
                time: lastSaved.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </span>
          ) : null}
          <button className="button-secondary px-3 py-1 text-[10px]">
            {t("workspace.noteEditor.share")}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto p-8 md:p-12 lg:p-16">
        <input
          type="text"
          value={title}
          onChange={(event) => commitDraft({ title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              bodyInputRef.current?.focus();
            }
          }}
          className="mb-6 w-full bg-transparent text-4xl font-display font-bold text-white placeholder:text-[var(--text-tertiary)] focus:outline-none"
          placeholder={t("workspace.noteEditor.untitled")}
        />

        <MarkdownEditor
          ref={bodyInputRef}
          value={body}
          onChange={(nextValue) => commitDraft({ body: nextValue })}
          placeholder={t("workspace.noteEditor.startWriting")}
        />
      </div>

      <div className="flex items-center justify-between border-t border-white/5 p-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
        <div className="flex items-center gap-4">
          <span>
            {t("nav.words")}: {bodyWordCount}
          </span>
          <span>
            {t("nav.chars")}: {body.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{t("workspace.noteEditor.markdown")}</span>
          <span>{t("workspace.noteEditor.encoding")}</span>
        </div>
      </div>
    </div>
  );
}
