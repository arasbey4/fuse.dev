import type { FileSnapshotDto, WorkspaceSummary } from "@fuse/protocol";
import type { ProjectProfile } from "@fuse/project-intelligence";

export type ActivityView =
  "explorer" | "search" | "source-control" | "run" | "extensions" | "agent" | "settings";

export interface OpenDocument extends FileSnapshotDto {
  savedContent: string;
}

export type WorkspaceState = (WorkspaceSummary & { profile: ProjectProfile }) | undefined;
