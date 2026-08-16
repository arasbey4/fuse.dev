import { useCallback, useEffect, useState, type JSX } from "react";
import { GitCommit, RefreshCw } from "lucide-react";
import type { GitStatusDto } from "@fuse/protocol";
import type { WorkspaceState } from "../types";

interface GitPanelProps {
  workspace: WorkspaceState;
  onOpenFile(path: string): void;
  onError(message: string | undefined): void;
}

export function GitPanel({ workspace, onOpenFile, onError }: GitPanelProps): JSX.Element {
  const [status, setStatus] = useState<GitStatusDto>();
  const [diff, setDiff] = useState("");
  const [commitMessage, setCommitMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!workspace) return;
    try {
      setStatus(await window.fuse.git.status(workspace.id));
      setDiff("");
    } catch (err) {
      onError(String(err));
    }
  }, [onError, workspace]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const showDiff = async (path: string) => {
    if (!workspace) return;
    try {
      setDiff(await window.fuse.git.diff(workspace.id, path));
    } catch (err) {
      onError(String(err));
    }
  };

  const commit = async () => {
    if (!workspace || !commitMessage.trim()) return;
    try {
      await window.fuse.git.commit(workspace.id, commitMessage.trim());
      setCommitMessage("");
      await refresh();
    } catch (err) {
      onError(String(err));
    }
  };

  if (!workspace) {
    return <EmptyPanel title="Source Control" message="Open a project to inspect Git status." />;
  }

  if (status && !status.isRepository) {
    return <EmptyPanel title="Source Control" message="This workspace is not a Git repository." />;
  }

  return (
    <section className="panel-section source-control">
      <div className="panel-header">
        <h2>Source Control</h2>
        <button type="button" onClick={() => void refresh()} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>
      <p className="muted">Branch: {status?.branch ?? "unknown"}</p>
      <div className="git-files">
        {status?.files.map((file) => (
          <button
            key={file.path}
            type="button"
            className="git-file"
            onClick={() => void showDiff(file.path)}
          >
            <span>
              {file.index}
              {file.workingTree}
            </span>
            <span>{file.path}</span>
          </button>
        ))}
      </div>
      <div className="commit-box">
        <textarea
          value={commitMessage}
          onChange={(event) => setCommitMessage(event.target.value)}
          placeholder="Commit message"
        />
        <button type="button" onClick={() => void commit()} disabled={!commitMessage.trim()}>
          <GitCommit size={15} />
          Commit staged changes
        </button>
      </div>
      <pre
        className="diff-view"
        onDoubleClick={() => diff && onOpenFile(diffHeaderPath(diff) ?? "")}
      >
        {diff || "Select a changed file to inspect its diff."}
      </pre>
    </section>
  );
}

function EmptyPanel({ title, message }: { title: string; message: string }): JSX.Element {
  return (
    <section className="panel-section centered-panel">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
    </section>
  );
}

function diffHeaderPath(diff: string): string | undefined {
  const match = diff.match(/\+\+\+ b\/(.+)/);
  return match?.[1];
}
