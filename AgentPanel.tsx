import type { JSX } from "react";
import { Activity, CheckCircle2, CircleDashed, Shield } from "lucide-react";
import type { WorkspaceState } from "../types";

interface AgentPanelProps {
  workspace: WorkspaceState;
}

export function AgentPanel({ workspace }: AgentPanelProps): JSX.Element {
  return (
    <section className="panel-section agent-panel-view">
      <h2>Agent Runtime</h2>
      <div className="agent-state-card">
        <Activity size={18} />
        <div>
          <strong>IDLE</strong>
          <span>
            {workspace ? `Ready in ${workspace.name}` : "Open a project to run agent tasks."}
          </span>
        </div>
      </div>
      <div className="agent-lane">
        <span>
          <CheckCircle2 size={15} /> State machine foundation
        </span>
        <span>
          <Shield size={15} /> Permission engine
        </span>
        <span>
          <CircleDashed size={15} /> Planner and tool loop next
        </span>
      </div>
      <p className="muted">
        The first implementation includes the bounded state machine, permission categories, tool
        registry, and command classifier. Full autonomous code-edit execution will build on this
        foundation without bypassing review and permission boundaries.
      </p>
    </section>
  );
}
