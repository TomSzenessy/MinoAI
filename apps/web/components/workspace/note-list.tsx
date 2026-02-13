"use client";

import { NoteSummary } from "@/lib/api";
import { useTranslation } from "@/components/i18n-provider";

interface NoteListProps {
  notes: NoteSummary[];
  loading: boolean;
  selectedPath?: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSelectNote: (note: NoteSummary) => void;
}

export function NoteList({
  notes,
  loading,
  selectedPath,
  searchQuery,
  onSearchQueryChange,
  onSelectNote,
}: NoteListProps) {
  const { t } = useTranslation();

  return (
    <div className="w-72 border-r border-white/5 bg-mino-surface/30 backdrop-blur-lg flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder={t("nav.searchPlaceholder")}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-mino-md py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-mino-purple/40 focus:ring-1 focus:ring-mino-purple/40 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-tertiary)] text-xs animate-pulse">
            {t("workspace.noteList.syncing")}
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-tertiary)] text-xs leading-relaxed">
            {t("workspace.noteList.emptyTitle")} <br />
            {t("workspace.noteList.emptySubtitle")}
          </div>
        ) : (
          <div className="flex flex-col">
            {notes.map((note) => (
              <button
                key={note.path}
                onClick={() => onSelectNote(note)}
                className={`w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/5 ${
                  selectedPath === note.path
                    ? "bg-mino-purple/10 border-r-2 border-r-mino-purple"
                    : ""
                }`}
              >
                <h3
                  className={`text-sm font-bold mb-1 truncate ${
                    selectedPath === note.path
                      ? "text-mino-purple"
                      : "text-white"
                  }`}
                >
                  {note.title}
                </h3>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--text-tertiary)] truncate mr-2">
                    {note.path}
                  </span>
                </div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[9px] uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
