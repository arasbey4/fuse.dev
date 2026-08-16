import type { JSX } from "react";
import Editor from "@monaco-editor/react";
import { Save, SplitSquareHorizontal, X } from "lucide-react";
import type { OpenDocument } from "../types";

interface EditorAreaProps {
  documents: OpenDocument[];
  activePath: string | undefined;
  onActivePathChange(path: string | undefined): void;
  onChange(path: string, content: string): void;
  onClose(path: string): void;
  onSave(): void;
}

export function EditorArea({
  documents,
  activePath,
  onActivePathChange,
  onChange,
  onClose,
  onSave,
}: EditorAreaProps): JSX.Element {
  const activeDocument = documents.find((document) => document.path === activePath);

  return (
    <section className="editor-area">
      <div className="editor-tabs">
        {documents.map((document) => {
          const dirty = document.content !== document.savedContent;
          return (
            <button
              key={document.path}
              type="button"
              className={document.path === activePath ? "tab active" : "tab"}
              onClick={() => onActivePathChange(document.path)}
              title={document.path}
            >
              <span>
                {dirty ? "● " : ""}
                {document.path.split("/").at(-1)}
              </span>
              <X
                size={13}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(document.path);
                }}
              />
            </button>
          );
        })}
        <div className="editor-actions">
          <button type="button" title="Save" onClick={onSave} disabled={!activeDocument}>
            <Save size={15} />
          </button>
          <button type="button" title="Split editor view is planned" disabled>
            <SplitSquareHorizontal size={15} />
          </button>
        </div>
      </div>
      <div className="monaco-host">
        {activeDocument ? (
          <Editor
            path={activeDocument.path}
            language={activeDocument.language}
            value={activeDocument.content}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              renderWhitespace: "selection",
              wordWrap: "off",
            }}
            onChange={(value) => onChange(activeDocument.path, value ?? "")}
          />
        ) : (
          <div className="empty-editor">
            <h1>FUSE.DEV</h1>
            <p>Open a project and select a file to begin.</p>
          </div>
        )}
      </div>
    </section>
  );
}
