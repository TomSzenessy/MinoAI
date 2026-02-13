"use client";

import { fetchFileTree, TreeItem } from "@/lib/api";
import { useTranslation } from "@/components/i18n-provider";
import { LinkedServerProfile } from "@/lib/storage";
import { useState, useEffect } from "react";

interface SidebarProps {
  noteCount: number;
  onNewNote?: () => void;
  profileName?: string;
  profile?: LinkedServerProfile | null;
  onSelectNote?: (path: string) => void;
}

export function Sidebar({
  noteCount,
  onNewNote,
  profileName,
  profile,
  onSelectNote,
}: SidebarProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile || profile.source === "local") return;

    fetchFileTree(profile.serverUrl, profile.apiKey)
      .then(setTree)
      .catch(console.error);
  }, [profile]);

  const toggleFolder = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTreeItem = (item: TreeItem, level = 0) => {
    const isExpanded = expanded[item.path];
    const isFolder = item.type === "folder";

    return (
      <div key={item.path}>
        <button
          onClick={() =>
            isFolder ? toggleFolder(item.path) : onSelectNote?.(item.path)
          }
          className={`w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors hover:bg-white/5 ${level > 0 ? "pl-" + (4 + level * 2) : ""}`}
          style={{ paddingLeft: `${1 + level * 0.75}rem` }}
        >
          <span className="opacity-40">
            {isFolder ? (isExpanded ? "▾" : "▸") : "📄"}
          </span>
          <span
            className={`${isFolder ? "text-[var(--text-secondary)] font-medium" : "text-[var(--text-tertiary)]"}`}
          >
            {item.name}
          </span>
          {isFolder && item.itemCount !== undefined && (
            <span className="ml-auto text-[10px] opacity-30">
              {item.itemCount}
            </span>
          )}
        </button>
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-mino-surface/50 backdrop-blur-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-mino-purple animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-tertiary)]">
            {t("workspace.sidebar.title")}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-6">
          <button
            onClick={onNewNote}
            className="button-primary w-full py-2 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>{t("nav.newNote")}</span>
          </button>
        </div>

        <nav className="space-y-1">
          <div className="px-4 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-tertiary)] opacity-50">
              {t("workspace.sidebar.library")}
            </span>
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white bg-white/5 border-r-2 border-mino-purple transition-all">
            <span className="text-lg opacity-70">📁</span>
            <span className="font-medium">{t("nav.allNotes")}</span>
            <span className="ml-auto text-[10px] opacity-50">{noteCount}</span>
          </button>

          <div className="mt-6">
            <div className="px-4 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-tertiary)] opacity-50">
                {t("workspace.sidebar.files")}
              </span>
            </div>
            {tree.length > 0 ? (
              <div className="space-y-0.5">
                {tree.map((item) => renderTreeItem(item))}
              </div>
            ) : (
              <div className="px-4 py-2 text-[10px] text-[var(--text-tertiary)] italic opacity-50">
                {profile?.source === "local"
                  ? t("workspace.sidebar.localDemoFoldersUnsupported")
                  : t("workspace.sidebar.noFoldersFound")}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 glass-card p-3 rounded-mino-lg">
          <div className="h-8 w-8 rounded-full bg-mino-purple flex items-center justify-center font-bold text-sm text-white">
            {profileName?.[0] || "M"}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">
              {profileName || t("workspace.statusBar.defaultServerName")}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("settings.server.connected")}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
