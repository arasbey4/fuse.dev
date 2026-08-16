import { useCallback, useEffect, useState, type JSX } from "react";
import { File, Folder, FolderOpen, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { FileEntryDto } from "@fuse/protocol";
import type { WorkspaceState } from "../types";

interface ExplorerPanelProps {
  workspace: WorkspaceState;
  onOpenFile(path: string): void;
  onError(message: string | undefined): void;
}

export function ExplorerPanel({ workspace, onOpenFile, onError }: ExplorerPanelProps): JSX.Element {
  const [entriesByPath, setEntriesByPath] = useState<Record<string, FileEntryDto[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["."]));

  const loadDirectory = useCallback(
    async (path = ".") => {
      if (!workspace) return;
      try {
        const entries = await window.fuse.workspace.listDirectory(workspace.id, path);
        setEntriesByPath((current) => ({ ...current, [path]: entries }));
      } catch (err) {
        onError(String(err));
      }
    },
    [onError, workspace],
  );

  useEffect(() => {
    setEntriesByPath({});
    setExpanded(new Set(["."]));
    void loadDirectory(".");
  }, [loadDirectory, workspace?.id]);

  const createEntry = async (type: "file" | "directory") => {
    if (!workspace) return;
    const target = window.prompt(type === "file" ? "New file path" : "New folder path");
    if (!target) return;
    try {
      await window.fuse.workspace.createEntry(workspace.id, target, type, "");
      await loadDirectory(parentPath(target));
    } catch (err) {
      onError(String(err));
    }
  };

  const removeEntry = async (entry: FileEntryDto) => {
    if (!workspace) return;
    const ok = window.confirm(`Delete ${entry.path}? This cannot be undone by FUSE.`);
    if (!ok) return;
    try {
      await window.fuse.workspace.deleteEntry(workspace.id, entry.path, entry.type === "directory");
      await loadDirectory(parentPath(entry.path));
    } catch (err) {
      onError(String(err));
    }
  };

  const renameEntry = async (entry: FileEntryDto) => {
    if (!workspace) return;
    const target = window.prompt("Rename to", entry.path);
    if (!target || target === entry.path) return;
    try {
      await window.fuse.workspace.renameEntry(workspace.id, entry.path, target);
      await loadDirectory(parentPath(entry.path));
      await loadDirectory(parentPath(target));
    } catch (err) {
      onError(String(err));
    }
  };

  if (!workspace) {
    return (
      <section className="panel-section centered-panel">
        <h2>No Project</h2>
        <p className="muted">Open a folder to browse and edit real files.</p>
      </section>
    );
  }

  return (
    <section className="panel-section explorer">
      <div className="panel-header">
        <h2>Explorer</h2>
        <div className="toolbar">
          <button type="button" title="New file" onClick={() => void createEntry("file")}>
            <Plus size={15} />
          </button>
          <button type="button" title="New folder" onClick={() => void createEntry("directory")}>
            <Folder size={15} />
          </button>
          <button type="button" title="Refresh" onClick={() => void loadDirectory(".")}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
      <FileTree
        path="."
        depth={0}
        entriesByPath={entriesByPath}
        expanded={expanded}
        onToggle={(path) => {
          const next = new Set(expanded);
          if (next.has(path)) {
            next.delete(path);
          } else {
            next.add(path);
            void loadDirectory(path);
          }
          setExpanded(next);
        }}
        onOpenFile={onOpenFile}
        onDelete={(entry) => void removeEntry(entry)}
        onRename={(entry) => void renameEntry(entry)}
      />
    </section>
  );
}

interface FileTreeProps {
  path: string;
  depth: number;
  entriesByPath: Record<string, FileEntryDto[]>;
  expanded: Set<string>;
  onToggle(path: string): void;
  onOpenFile(path: string): void;
  onDelete(entry: FileEntryDto): void;
  onRename(entry: FileEntryDto): void;
}

function FileTree(props: FileTreeProps): JSX.Element {
  const entries = props.entriesByPath[props.path] ?? [];
  return (
    <div className="file-tree">
      {entries.map((entry) => {
        const isOpen = props.expanded.has(entry.path);
        return (
          <div key={entry.path}>
            <div
              className={`file-row ${entry.hidden ? "dimmed" : ""}`}
              style={{ paddingLeft: 8 + props.depth * 14 }}
              onDoubleClick={() =>
                entry.type === "file" ? props.onOpenFile(entry.path) : props.onToggle(entry.path)
              }
            >
              <button
                type="button"
                className="file-main"
                onClick={() =>
                  entry.type === "file" ? props.onOpenFile(entry.path) : props.onToggle(entry.path)
                }
              >
                {entry.type === "directory" ? (
                  isOpen ? (
                    <FolderOpen size={15} />
                  ) : (
                    <Folder size={15} />
                  )
                ) : (
                  <File size={15} />
                )}
                <span>{entry.name}</span>
              </button>
              <button type="button" title="Rename" onClick={() => props.onRename(entry)}>
                <span className="mini-action">...</span>
              </button>
              <button type="button" title="Delete" onClick={() => props.onDelete(entry)}>
                <Trash2 size={13} />
              </button>
            </div>
            {entry.type === "directory" && isOpen && (
              <FileTree {...props} path={entry.path} depth={props.depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function parentPath(filePath: string): string {
  const parts = filePath.split("/");
  parts.pop();
  return parts.length ? parts.join("/") : ".";
}
