"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/i18n-provider";
import type { NoteSummary } from "@/lib/api";

interface CommandPaletteProps {
  open: boolean;
  notes: NoteSummary[];
  onClose: () => void;
  onOpenNote: (note: NoteSummary) => void;
  onCreateNote: () => void;
  onToggleAgent: () => void;
  onOpenSettings: () => void;
}

type PaletteItem =
  | {
      id: string;
      kind: "command";
      icon: string;
      label: string;
      shortcut?: string;
      action: () => void;
    }
  | {
      id: string;
      kind: "note";
      icon: string;
      label: string;
      detail: string;
      action: () => void;
    };

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function includesQuery(value: string, query: string): boolean {
  return normalize(value).includes(query);
}

export function CommandPalette({
  open,
  notes,
  onClose,
  onOpenNote,
  onCreateNote,
  onToggleAgent,
  onOpenSettings,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    return () => window.clearTimeout(timeout);
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const normalizedQuery = normalize(query);

    const commandItems: PaletteItem[] = [
      {
        id: "command:new",
        kind: "command",
        icon: "✏",
        label: t("workspace.commandPalette.newNote"),
        shortcut: "⌘N",
        action: onCreateNote,
      },
      {
        id: "command:agent",
        kind: "command",
        icon: "✦",
        label: t("workspace.commandPalette.toggleAgent"),
        shortcut: "⌘J",
        action: onToggleAgent,
      },
      {
        id: "command:settings",
        kind: "command",
        icon: "⚙",
        label: t("workspace.commandPalette.openSettings"),
        shortcut: "⌘,",
        action: onOpenSettings,
      },
    ];

    const filteredCommands =
      normalizedQuery.length === 0
        ? commandItems
        : commandItems.filter((item) => includesQuery(item.label, normalizedQuery));

    const filteredNotes = notes
      .filter((note) => {
        if (normalizedQuery.length === 0) return true;
        return (
          includesQuery(note.title, normalizedQuery) ||
          includesQuery(note.path, normalizedQuery) ||
          note.tags.some((tag) => includesQuery(tag, normalizedQuery))
        );
      })
      .slice(0, 8)
      .map<PaletteItem>((note) => ({
        id: `note:${note.path}`,
        kind: "note",
        icon: "📄",
        label: note.title,
        detail: note.path,
        action: () => onOpenNote(note),
      }));

    return [...filteredCommands, ...filteredNotes];
  }, [notes, onCreateNote, onOpenNote, onOpenSettings, onToggleAgent, query, t]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIndex((prev) => {
      if (items.length === 0) return 0;
      return Math.min(prev, items.length - 1);
    });
  }, [items, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          items.length === 0 ? 0 : (prev - 1 + items.length) % items.length,
        );
        return;
      }

      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (!item) return;
        event.preventDefault();
        item.action();
        onClose();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items, onClose, open, selectedIndex]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("workspace.commandPalette.title")}
    >
      <div className="mt-16 w-full max-w-2xl overflow-hidden rounded-mino-xl border border-white/10 bg-mino-surface/95 shadow-2xl">
        <div className="border-b border-white/10 p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field w-full"
            placeholder={t("workspace.commandPalette.placeholder")}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
              {t("workspace.commandPalette.empty")}
            </div>
          ) : (
            items.map((item, index) => {
              const selected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    selected ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                >
                  <span className="text-sm opacity-80">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{item.label}</span>
                    {item.kind === "note" ? (
                      <span className="block truncate text-xs text-[var(--text-tertiary)]">{item.detail}</span>
                    ) : null}
                  </span>
                  {item.kind === "command" && item.shortcut ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                      {item.shortcut}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <span>{t("workspace.commandPalette.hintNavigate")}</span>
          <span>{t("workspace.commandPalette.hintSelect")}</span>
          <span>{t("workspace.commandPalette.hintClose")}</span>
        </div>
      </div>
    </div>
  );
}
