"use client";

import { fetchNoteDetail, Note, NoteSummary, updateNote } from "@/lib/api";
import { useTranslation } from "@/components/i18n-provider";
import { LinkedServerProfile } from "@/lib/storage";
import { useState, useEffect, useRef } from "react";

interface NoteEditorProps {
  profile: LinkedServerProfile | null;
  noteSummary: NoteSummary | null;
  onSave?: (note: Note) => void;
}

export function NoteEditor({ profile, noteSummary, onSave }: NoteEditorProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch full note content when summary changes
  useEffect(() => {
    if (!profile || !noteSummary) {
      setNote(null);
      setContent("");
      return;
    }

    if (profile.source === "local") {
      setContent(
        `# ${noteSummary.title}\n\n${t("workspace.localDemo.noteBody")}`,
      );
      setNote({
        ...noteSummary,
        content: "",
        frontmatter: {},
      });
      return;
    }

    async function loadNote() {
      try {
        setLoading(true);
        const detail = await fetchNoteDetail(
          profile!.serverUrl,
          profile!.apiKey,
          noteSummary!.path,
        );
        setNote(detail);
        setContent(detail.content);
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadNote();
  }, [profile, noteSummary, t]);

  // Handle auto-save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    if (profile?.source === "local") return;
    if (!profile || !note) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updated = await updateNote(
          profile.serverUrl,
          profile.apiKey,
          note.path,
          newContent,
        );
        setLastSaved(new Date());
        if (onSave) onSave(updated);
      } catch (err) {
        console.error("Failed to save note:", err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  if (!noteSummary) {
    return (
      <div className="flex-1 flex items-center justify-center bg-mino-base">
        <div className="text-center animate-fade-up">
          <div className="text-4xl mb-4 opacity-20">✦</div>
          <h2 className="text-lg font-bold text-[var(--text-tertiary)]">
            {t("nav.selectNote")}
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-2">
            {t("nav.autoSync")}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-mino-base">
        <div className="animate-pulse text-[var(--text-tertiary)] text-xs uppercase tracking-widest font-bold">
          {t("workspace.noteEditor.loadingContent")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-mino-base overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-mino-surface/20">
        <div className="flex items-center gap-4">
          <button className="text-[10px] text-[var(--text-tertiary)] hover:text-white transition-colors">
            {t("workspace.noteEditor.workspace")}
          </button>
          <span className="text-[10px] text-[var(--text-tertiary)]">/</span>
          <span className="text-[10px] text-white font-medium truncate max-w-[200px]">
            {noteSummary.path}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {saving ? (
            <span className="text-[10px] text-mino-purple flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-mino-purple" />
              {t("workspace.noteEditor.saving")}
            </span>
          ) : lastSaved ? (
            <span className="text-[10px] text-success flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("workspace.noteEditor.savedAt", {
                time: lastSaved.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </span>
          ) : null}
          <button className="button-secondary text-[10px] px-3 py-1">
            {t("workspace.noteEditor.share")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 max-w-4xl mx-auto w-full">
        <input
          type="text"
          value={noteSummary.title}
          readOnly
          className="w-full bg-transparent border-none text-4xl font-display font-bold text-white focus:outline-none mb-8"
        />

        <textarea
          className="w-full h-full bg-transparent border-none text-[15px] leading-relaxed text-[var(--text-secondary)] focus:outline-none resize-none min-h-[500px]"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          spellCheck={false}
          placeholder={t("workspace.noteEditor.startWriting")}
        />
      </div>

      <div className="p-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-4">
          <span>
            {t("nav.words")}: {content.split(/\s+/).filter(Boolean).length}
          </span>
          <span>
            {t("nav.chars")}: {content.length}
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
