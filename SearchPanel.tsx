import { useState, type JSX } from "react";
import { Search } from "lucide-react";
import type { SearchResultDto } from "@fuse/protocol";
import type { WorkspaceState } from "../types";

interface SearchPanelProps {
  workspace: WorkspaceState;
  onOpenFile(path: string): void;
  onError(message: string | undefined): void;
}

export function SearchPanel({ workspace, onOpenFile, onError }: SearchPanelProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultDto[]>([]);

  const runSearch = async () => {
    if (!workspace || !query.trim()) return;
    try {
      setResults(
        await window.fuse.workspace.search(workspace.id, query.trim(), {
          includeContent: true,
          caseSensitive: false,
          maxResults: 100,
        }),
      );
    } catch (err) {
      onError(String(err));
    }
  };

  return (
    <section className="panel-section search-panel">
      <h2>Search</h2>
      <div className="search-box">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void runSearch()}
          placeholder="Search files and content"
          disabled={!workspace}
        />
      </div>
      <div className="search-results">
        {results.map((result, index) => (
          <button
            key={`${result.path}-${result.line ?? "file"}-${index}`}
            type="button"
            onClick={() => onOpenFile(result.path)}
          >
            <strong>
              {result.path}
              {result.line ? `:${result.line}` : ""}
            </strong>
            <span>{result.preview ?? result.type}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
