"use client";

import type { PluginDefinition } from "@/lib/plugins";

interface PluginCardProps {
  plugin: PluginDefinition;
  enabled: boolean;
  enabledLabel: string;
  disabledLabel: string;
  comingSoonLabel: string;
  configureLabel: string;
  onToggle: (pluginId: string) => void;
  onConfigure: (pluginId: string) => void;
}

export function PluginCard({
  plugin,
  enabled,
  enabledLabel,
  disabledLabel,
  comingSoonLabel,
  configureLabel,
  onToggle,
  onConfigure,
}: PluginCardProps) {
  const statusClass = plugin.status === "available" ? "available" : "coming-soon";
  const statusLabel = plugin.status === "available" ? (enabled ? enabledLabel : disabledLabel) : comingSoonLabel;

  return (
    <article className="plugin-card">
      <div className="plugin-icon" aria-hidden>
        {plugin.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">{plugin.name}</h3>
          <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
          <span className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {plugin.priority}
          </span>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">{plugin.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`toggle-switch ${enabled ? "active" : ""}`}
            onClick={() => onToggle(plugin.id)}
            disabled={plugin.status !== "available"}
            aria-label={enabled ? disabledLabel : enabledLabel}
          />
          {plugin.requiresApiKey ? (
            <button className="button-secondary text-xs" onClick={() => onConfigure(plugin.id)}>
              {configureLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
