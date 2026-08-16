/// <reference types="vite/client" />

import type {
  FileEntryDto,
  FileSnapshotDto,
  GitStatusDto,
  SearchResultDto,
  TerminalDataEvent,
  TerminalExitEvent,
  WorkspaceSummary,
} from "@fuse/protocol";
import type { FuseSettings } from "@fuse/config";
import type { ProjectProfile } from "@fuse/project-intelligence";

type WorkspaceOpenResult = (WorkspaceSummary & { profile: ProjectProfile }) | undefined;
type TerminalCreateResult = { sessionId: string; shell: string; cwd: string };
type SettingsResult = {
  settings: FuseSettings;
  secrets: { hasAiApiKey: boolean };
  permissions: unknown;
};

declare global {
  interface Window {
    fuse: {
      workspace: {
        open(path?: string): Promise<WorkspaceOpenResult>;
        listDirectory(workspaceId: string, path?: string): Promise<FileEntryDto[]>;
        readFile(workspaceId: string, path: string): Promise<FileSnapshotDto>;
        writeFile(
          workspaceId: string,
          path: string,
          content: string,
          expectedMtimeMs?: number,
        ): Promise<FileSnapshotDto>;
        createEntry(
          workspaceId: string,
          path: string,
          type: "file" | "directory",
          content?: string,
        ): Promise<{ ok: true }>;
        deleteEntry(workspaceId: string, path: string, recursive?: boolean): Promise<{ ok: true }>;
        renameEntry(workspaceId: string, fromPath: string, toPath: string): Promise<{ ok: true }>;
        search(
          workspaceId: string,
          query: string,
          options?: { includeContent?: boolean; caseSensitive?: boolean; maxResults?: number },
        ): Promise<SearchResultDto[]>;
        analyze(workspaceId: string): Promise<ProjectProfile>;
      };
      git: {
        status(workspaceId: string): Promise<GitStatusDto>;
        diff(workspaceId: string, path?: string): Promise<string>;
        branches(workspaceId: string): Promise<string[]>;
        log(workspaceId: string): Promise<string>;
        stage(workspaceId: string, path: string): Promise<{ ok: true }>;
        unstage(workspaceId: string, path: string): Promise<{ ok: true }>;
        commit(workspaceId: string, message: string): Promise<string>;
      };
      terminal: {
        create(workspaceId: string, cwd?: string, shell?: string): Promise<TerminalCreateResult>;
        input(sessionId: string, data: string): Promise<{ ok: true }>;
        stop(sessionId: string): Promise<{ ok: true }>;
        onData(listener: (payload: TerminalDataEvent) => void): () => void;
        onExit(listener: (payload: TerminalExitEvent) => void): () => void;
      };
      settings: {
        get(): Promise<SettingsResult>;
        update(patch: unknown): Promise<FuseSettings>;
        setAiApiKey(apiKey: string): Promise<{ ok: true }>;
      };
      ai: {
        startChat(
          workspaceId: string,
          messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
          context?: unknown,
        ): Promise<{ streamId: string }>;
        cancelChat(streamId: string): Promise<{ ok: true }>;
        onChunk(listener: (payload: { streamId: string; text: string }) => void): () => void;
        onDone(listener: (payload: { streamId: string }) => void): () => void;
        onError(
          listener: (payload: {
            streamId: string;
            error: { message: string; code: string };
          }) => void,
        ): () => void;
      };
    };
  }
}

export {};
