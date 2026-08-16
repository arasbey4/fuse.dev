import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { FUSE_BRAND } from "@fuse/ui";
import type { FileSnapshotDto } from "@fuse/protocol";
import type { FuseSettings } from "@fuse/config";
import type { ActivityView, OpenDocument, WorkspaceState } from "./types";
import { ActivityBar } from "./components/ActivityBar";
import { AgentPanel } from "./components/AgentPanel";
import { AiPanel } from "./components/AiPanel";
import { CommandPalette } from "./components/CommandPalette";
import { EditorArea } from "./components/EditorArea";
import { ExplorerPanel } from "./components/ExplorerPanel";
import { GitPanel } from "./components/GitPanel";
import { SearchPanel } from "./components/SearchPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TerminalPanel } from "./components/TerminalPanel";
import { TopBar } from "./components/TopBar";

export function App(): JSX.Element {
  const [workspace, setWorkspace] = useState<WorkspaceState>();
  const [activeView, setActiveView] = useState<ActivityView>("explorer");
  const [documents, setDocuments] = useState<OpenDocument[]>([]);
  const [activePath, setActivePath] = useState<string>();
  const [error, setError] = useState<string>();
  const [settings, setSettings] = useState<FuseSettings>();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    void window.fuse.settings.get().then((result) => setSettings(result.settings));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveActiveDocument();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const activeDocument = useMemo(
    () => documents.find((document) => document.path === activePath),
    [activePath, documents],
  );

  const openProject = useCallback(async () => {
    setError(undefined);
    try {
      const opened = await window.fuse.workspace.open();
      if (opened) {
        setWorkspace(opened);
        setDocuments([]);
        setActivePath(undefined);
        setActiveView("explorer");
      }
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const openFile = useCallback(
    async (path: string) => {
      if (!workspace) return;
      setError(undefined);
      try {
        const existing = documents.find((document) => document.path === path);
        if (existing) {
          setActivePath(existing.path);
          return;
        }
        const file = await window.fuse.workspace.readFile(workspace.id, path);
        const document = toOpenDocument(file);
        setDocuments((current) => [...current, document]);
        setActivePath(path);
      } catch (err) {
        setError(String(err));
      }
    },
    [documents, workspace],
  );

  const updateDocument = useCallback((path: string, content: string) => {
    setDocuments((current) =>
      current.map((document) => (document.path === path ? { ...document, content } : document)),
    );
  }, []);

  const closeDocument = useCallback(
    (path: string) => {
      const document = documents.find((item) => item.path === path);
      if (document && document.content !== document.savedContent) {
        const shouldClose = window.confirm(`${path} has unsaved changes. Close it anyway?`);
        if (!shouldClose) return;
      }
      setDocuments((current) => current.filter((item) => item.path !== path));
      if (activePath === path) {
        const remaining = documents.filter((item) => item.path !== path);
        setActivePath(remaining.at(-1)?.path);
      }
    },
    [activePath, documents],
  );

  const saveActiveDocument = useCallback(async () => {
    if (!workspace || !activeDocument) return;
    setError(undefined);
    try {
      const saved = await window.fuse.workspace.writeFile(
        workspace.id,
        activeDocument.path,
        activeDocument.content,
        activeDocument.mtimeMs,
      );
      setDocuments((current) =>
        current.map((document) =>
          document.path === saved.path
            ? { ...toOpenDocument(saved), content: saved.content }
            : document,
        ),
      );
    } catch (err) {
      setError(String(err));
    }
  }, [activeDocument, workspace]);

  const commands = useMemo(
    () => [
      { id: "open-project", label: "Open Project", run: openProject },
      { id: "save-file", label: "Save File", run: () => void saveActiveDocument() },
      { id: "search", label: "Search Project", run: () => setActiveView("search") },
      { id: "git-status", label: "Git Status", run: () => setActiveView("source-control") },
      { id: "terminal", label: "Open Terminal", run: () => setActiveView("run") },
      { id: "ai-chat", label: "AI Chat", run: () => setActiveView("agent") },
      { id: "settings", label: "Settings", run: () => setActiveView("settings") },
    ],
    [openProject, saveActiveDocument],
  );

  return (
    <div className="app-shell">
      <TopBar
        brand={FUSE_BRAND}
        workspace={workspace}
        settings={settings}
        activeDocument={activeDocument}
        onOpenProject={openProject}
        onOpenCommands={() => setCommandPaletteOpen(true)}
        onOpenSettings={() => setActiveView("settings")}
      />

      <div className="workspace-grid">
        <ActivityBar activeView={activeView} onChange={setActiveView} />
        <aside className="left-panel">
          {activeView === "explorer" && (
            <ExplorerPanel workspace={workspace} onOpenFile={openFile} onError={setError} />
          )}
          {activeView === "search" && (
            <SearchPanel workspace={workspace} onOpenFile={openFile} onError={setError} />
          )}
          {activeView === "source-control" && (
            <GitPanel workspace={workspace} onOpenFile={openFile} onError={setError} />
          )}
          {activeView === "run" && <AgentPanel workspace={workspace} />}
          {activeView === "extensions" && <ExtensionsPanel />}
          {activeView === "agent" && <AgentPanel workspace={workspace} />}
          {activeView === "settings" && (
            <SettingsPanel settings={settings} onSettingsChanged={setSettings} onError={setError} />
          )}
        </aside>

        <main className="editor-column">
          <EditorArea
            documents={documents}
            activePath={activePath}
            onActivePathChange={setActivePath}
            onChange={updateDocument}
            onClose={closeDocument}
            onSave={() => void saveActiveDocument()}
          />
          <TerminalPanel workspace={workspace} />
        </main>

        <AiPanel workspace={workspace} activeDocument={activeDocument} />
      </div>

      <footer className="status-bar">
        <span>{workspace ? workspace.rootPath : "No project open"}</span>
        <span>
          {activeDocument?.content !== activeDocument?.savedContent ? "Unsaved changes" : "Ready"}
        </span>
        {error && <span className="status-error">{error}</span>}
      </footer>

      <CommandPalette
        open={commandPaletteOpen}
        commands={commands}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}

function toOpenDocument(file: FileSnapshotDto): OpenDocument {
  return {
    ...file,
    savedContent: file.content,
  };
}

function ExtensionsPanel(): JSX.Element {
  return (
    <section className="panel-section">
      <h2>Extensions</h2>
      <p className="muted">
        Plugin manifests and capability-gated extension points are implemented in the SDK
        foundation. Executable plugins are planned after the tool and permission runtime hardening
        work.
      </p>
    </section>
  );
}
