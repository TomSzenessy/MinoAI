"use client";

import { fetchFileTree, TreeItem } from "@/lib/api";
import { useTranslation } from "@/components/i18n-provider";
import { LinkedServerProfile } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";

interface SidebarProps {
  noteCount: number;
  treeVersion?: string;
  onNewNote?: () => void;
  profileName?: string;
  profile?: LinkedServerProfile | null;
  profiles?: LinkedServerProfile[];
  onSelectProfile?: (profileId: string) => void;
  onOpenSettings?: () => void;
  onConnectServer?: () => void;
  onSelectNote?: (path: string) => void;
  onMoveNote?: (fromPath: string, targetFolderPath: string) => void;
}

export function Sidebar({
  noteCount,
  treeVersion,
  onNewNote,
  profileName,
  profile,
  profiles = [],
  onSelectProfile,
  onOpenSettings,
  onConnectServer,
  onSelectNote,
  onMoveNote,
}: SidebarProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.source === "local") {
      setTree([]);
      return;
    }

    fetchFileTree(profile.serverUrl, profile.apiKey)
      .then(setTree)
      .catch(console.error);
  }, [profile, treeVersion]);

  const selectableProfiles = useMemo(() => {
    if (profiles.length > 0) {
      return profiles;
    }

    return profile ? [profile] : [];
  }, [profile, profiles]);

  const toggleFolder = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleDropToFolder = (targetFolderPath: string) => {
    if (!draggingPath || !onMoveNote) {
      setDropTarget(null);
      return;
    }

    onMoveNote(draggingPath, targetFolderPath);
    setDraggingPath(null);
    setDropTarget(null);
  };

  const renderTreeItem = (item: TreeItem, level = 0) => {
    const isExpanded = expanded[item.path];
    const isFolder = item.type === "folder";
    const isDropTarget = isFolder && dropTarget === item.path;

    return (
      <div key={item.path}>
        <button
          onClick={() =>
            isFolder ? toggleFolder(item.path) : onSelectNote?.(item.path)
          }
          draggable={!isFolder}
          onDragStart={(event) => {
            if (isFolder) return;
            setDraggingPath(item.path);
            event.dataTransfer.setData("text/plain", item.path);
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            setDraggingPath(null);
            setDropTarget(null);
          }}
          onDragOver={(event) => {
            if (!isFolder || !draggingPath || draggingPath === item.path) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropTarget(item.path);
          }}
          onDragLeave={() => {
            if (isFolder && dropTarget === item.path) {
              setDropTarget(null);
            }
          }}
          onDrop={(event) => {
            if (!isFolder) return;
            event.preventDefault();
            const droppedPath = event.dataTransfer.getData("text/plain");
            if (droppedPath && !draggingPath) {
              setDraggingPath(droppedPath);
            }
            handleDropToFolder(item.path);
          }}
          className={`flex w-full items-center gap-2 px-4 py-1.5 text-xs transition-colors ${
            isDropTarget ? "bg-white/10 ring-1 ring-[var(--purple-300)]" : "hover:bg-white/5"
          }`}
          style={{ paddingLeft: `${1 + level * 0.75}rem` }}
        >
          <span className="opacity-40">{isFolder ? (isExpanded ? "▾" : "▸") : "📄"}</span>
          <span
            className={
              isFolder
                ? "font-medium text-[var(--text-secondary)]"
                : "text-[var(--text-tertiary)]"
            }
          >
            {item.name}
          </span>
          {isFolder && item.itemCount !== undefined ? (
            <span className="ml-auto text-[10px] opacity-30">{item.itemCount}</span>
          ) : null}
        </button>
        {isFolder && isExpanded && item.children ? (
          <div>{item.children.map((child) => renderTreeItem(child, level + 1))}</div>
        ) : null}
      </div>
    );
  };

  return (
    <aside className="flex h-full w-64 flex-col overflow-hidden border-r border-white/5 bg-mino-surface/50 backdrop-blur-xl">
      <div className="border-b border-white/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-mino-purple" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            {t("workspace.sidebar.title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="field py-2 text-xs"
            value={profile?.id ?? ""}
            onChange={(event) => onSelectProfile?.(event.target.value)}
            disabled={selectableProfiles.length === 0}
          >
            <option value="" disabled>
              {t("workspace.sidebar.selectServer")}
            </option>
            {selectableProfiles.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <button
            className="button-secondary !px-2 !py-2 text-xs"
            onClick={onOpenSettings}
            title={t("nav.settings")}
          >
            ⚙
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <span className="truncate">{profileName || t("settings.server.connected")}</span>
          <button
            className="text-[var(--purple-300)] hover:text-[var(--purple-200)]"
            onClick={onConnectServer}
          >
            {t("workspace.sidebar.connectServer")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="mb-6 px-4">
          <button
            onClick={onNewNote}
            className="button-primary flex w-full items-center justify-center gap-2 py-2"
          >
            <span className="text-xl">+</span>
            <span>{t("nav.newNote")}</span>
          </button>
        </div>

        <nav className="space-y-1">
          <div className="mb-2 px-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-50">
              {t("workspace.sidebar.library")}
            </span>
          </div>

          <button className="w-full border-r-2 border-mino-purple bg-white/5 px-4 py-2 text-left text-sm text-white transition-all">
            <div className="flex items-center gap-3">
              <span className="text-lg opacity-70">📁</span>
              <span className="font-medium">{t("nav.allNotes")}</span>
              <span className="ml-auto text-[10px] opacity-50">{noteCount}</span>
            </div>
          </button>

          <button
            className={`mt-1 w-full rounded-md border border-dashed px-4 py-1.5 text-left text-[10px] uppercase tracking-widest transition-colors ${
              dropTarget === ""
                ? "border-[var(--purple-300)] bg-white/10 text-white"
                : "border-white/10 text-[var(--text-tertiary)] hover:border-white/20 hover:text-white"
            }`}
            onDragOver={(event) => {
              if (!draggingPath) return;
              event.preventDefault();
              setDropTarget("");
            }}
            onDragLeave={() => {
              if (dropTarget === "") {
                setDropTarget(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const droppedPath = event.dataTransfer.getData("text/plain");
              if (droppedPath && !draggingPath) {
                setDraggingPath(droppedPath);
              }
              handleDropToFolder("");
            }}
          >
            {t("workspace.sidebar.dropToRoot")}
          </button>

          <div className="mt-6">
            <div className="mb-2 px-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-50">
                {t("workspace.sidebar.files")}
              </span>
            </div>
            {tree.length > 0 ? (
              <div className="space-y-0.5">{tree.map((item) => renderTreeItem(item))}</div>
            ) : (
              <div className="px-4 py-2 text-[10px] italic text-[var(--text-tertiary)] opacity-50">
                {profile?.source === "local"
                  ? t("workspace.sidebar.localDemoFoldersUnsupported")
                  : t("workspace.sidebar.noFoldersFound")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}
