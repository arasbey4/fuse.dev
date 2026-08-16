import { useEffect, useState, type JSX } from "react";
import { Bot, Send, Square } from "lucide-react";
import type { OpenDocument, WorkspaceState } from "../types";

interface AiPanelProps {
  workspace: WorkspaceState;
  activeDocument: OpenDocument | undefined;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AiPanel({ workspace, activeDocument }: AiPanelProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamId, setStreamId] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const offChunk = window.fuse.ai.onChunk(({ streamId: id, text }) => {
      if (id !== streamId) return;
      setMessages((current) => {
        const last = current.at(-1);
        if (last?.role === "assistant") {
          return [...current.slice(0, -1), { ...last, content: last.content + text }];
        }
        return [...current, { role: "assistant", content: text }];
      });
    });
    const offDone = window.fuse.ai.onDone(({ streamId: id }) => {
      if (id === streamId) setStreamId(undefined);
    });
    const offError = window.fuse.ai.onError(({ streamId: id, error }) => {
      if (id === streamId) {
        setStreamId(undefined);
        setError(`${error.code}: ${error.message}`);
      }
    });
    return () => {
      offChunk();
      offDone();
      offError();
    };
  }, [streamId]);

  const send = async () => {
    if (!workspace || !draft.trim()) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: draft.trim() }];
    setMessages(nextMessages);
    setDraft("");
    setError(undefined);
    try {
      const stream = await window.fuse.ai.startChat(
        workspace.id,
        nextMessages.map((message) => ({ role: message.role, content: message.content })),
        { activeFilePath: activeDocument?.path },
      );
      setStreamId(stream.streamId);
    } catch (err) {
      setError(String(err));
    }
  };

  const cancel = async () => {
    if (!streamId) return;
    await window.fuse.ai.cancelChat(streamId);
    setStreamId(undefined);
  };

  return (
    <aside className="ai-panel">
      <div className="panel-header">
        <h2>
          <Bot size={16} /> AI Agent
        </h2>
        <button type="button" onClick={() => setMessages([])}>
          Clear
        </button>
      </div>
      <div className="context-strip">
        {workspace ? workspace.name : "Open a project to provide context"}
        {activeDocument ? ` · ${activeDocument.path}` : ""}
      </div>
      <div className="chat-log">
        {messages.length === 0 && (
          <div className="empty-chat">
            <strong>Ask about the current project.</strong>
            <span>Responses stream from your configured provider. No fake fallback is used.</span>
          </div>
        )}
        {messages.map((message, index) => (
          <article key={index} className={`chat-message ${message.role}`}>
            <strong>{message.role === "user" ? "You" : "FUSE"}</strong>
            <p>{message.content}</p>
          </article>
        ))}
        {error && <div className="inline-error">{error}</div>}
      </div>
      <div className="chat-compose">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={workspace ? "Give FUSE a goal..." : "Open a project first"}
          disabled={!workspace}
        />
        {streamId ? (
          <button type="button" onClick={() => void cancel()} title="Cancel generation">
            <Square size={16} />
          </button>
        ) : (
          <button type="button" onClick={() => void send()} disabled={!workspace || !draft.trim()}>
            <Send size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
