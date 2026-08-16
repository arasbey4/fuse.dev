import type { JSX } from "react";
import { Bot, Command, FolderOpen, Settings } from "lucide-react";
import type { FuseSettings } from "@fuse/config";
import type { FUSE_BRAND } from "@fuse/ui";
import type { OpenDocument, WorkspaceState } from "../types";

interface TopBarProps {
  brand: typeof FUSE_BRAND;
  workspace: WorkspaceState;
  settings: FuseSettings | undefined;
  activeDocument: OpenDocument | undefined;
  onOpenProject(): void;
  onOpenCommands(): void;
  onOpenSettings(): void;
}

export function TopBar({
  brand,
  workspace,
  settings,
  activeDocument,
  onOpenProject,
  onOpenCommands,
  onOpenSettings,
}: TopBarProps): JSX.Element {
  return (
    <header className="top-bar">
      <div className="brand-mark" aria-label={brand.name}>
        <span className="brand-glyph">F</span>
        <span>
          <strong>{brand.name}</strong>
          <small>{brand.tagline}</small>
        </span>
      </div>
      <button className="project-switcher" type="button" onClick={onOpenProject}>
        <FolderOpen size={16} />
        <span>{workspace?.name ?? "Open Project"}</span>
      </button>
      <button className="command-input" type="button" onClick={onOpenCommands}>
        <Command size={15} />
        <span>Command or search</span>
        <kbd>Ctrl Shift P</kbd>
      </button>
      <div className="top-meta">
        <span>{activeDocument?.path ?? "No file selected"}</span>
        <span className="ai-pill">
          <Bot size={14} />
          {settings?.ai.model ?? "AI not configured"}
        </span>
        <button
          className="icon-button"
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
