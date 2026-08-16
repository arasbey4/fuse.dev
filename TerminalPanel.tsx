import { useEffect, useRef, useState, type JSX } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { Plus, Square } from "lucide-react";
import type { WorkspaceState } from "../types";

interface TerminalPanelProps {
  workspace: WorkspaceState;
}

export function TerminalPanel({ workspace }: TerminalPanelProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [sessionId, setSessionId] = useState<string>();
  const [shellLabel, setShellLabel] = useState("Terminal");

  useEffect(() => {
    if (!hostRef.current || terminalRef.current) return;
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: "JetBrains Mono, Consolas, monospace",
      fontSize: 12,
      theme: {
        background: "#07090b",
        foreground: "#d7dee7",
        cursor: "#a8ffcb",
        selectionBackground: "#284237",
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(hostRef.current);
    fit.fit();
    terminalRef.current = terminal;
    fitRef.current = fit;

    const resizeObserver = new ResizeObserver(() => fit.fit());
    resizeObserver.observe(hostRef.current);
    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unsubscribeData = window.fuse.terminal.onData(({ sessionId: id, data }) => {
      if (id === sessionId) terminalRef.current?.write(data);
    });
    const unsubscribeExit = window.fuse.terminal.onExit(({ sessionId: id, exitCode }) => {
      if (id === sessionId)
        terminalRef.current?.writeln(`\r\n[process exited: ${exitCode ?? "unknown"}]`);
    });
    return () => {
      unsubscribeData();
      unsubscribeExit();
    };
  }, [sessionId]);

  useEffect(() => {
    const disposable = terminalRef.current?.onData((data) => {
      if (sessionId) void window.fuse.terminal.input(sessionId, data);
    });
    return () => disposable?.dispose();
  }, [sessionId]);

  const startTerminal = async () => {
    if (!workspace) return;
    const session = await window.fuse.terminal.create(workspace.id);
    setSessionId(session.sessionId);
    setShellLabel(session.shell);
    terminalRef.current?.clear();
    terminalRef.current?.writeln(`FUSE terminal: ${session.shell}`);
  };

  const stopTerminal = async () => {
    if (!sessionId) return;
    await window.fuse.terminal.stop(sessionId);
    setSessionId(undefined);
  };

  return (
    <section className="terminal-panel">
      <div className="panel-header compact">
        <h2>{shellLabel}</h2>
        <div className="toolbar">
          <button
            type="button"
            title="New terminal"
            onClick={() => void startTerminal()}
            disabled={!workspace}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            title="Stop terminal"
            onClick={() => void stopTerminal()}
            disabled={!sessionId}
          >
            <Square size={13} />
          </button>
        </div>
      </div>
      <div className="terminal-host" ref={hostRef} />
    </section>
  );
}
