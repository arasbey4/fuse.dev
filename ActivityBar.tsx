import type { JSX } from "react";
import { Bot, Boxes, Bug, Files, GitBranch, Search, Settings, TerminalSquare } from "lucide-react";
import type { ActivityView } from "../types";

interface ActivityBarProps {
  activeView: ActivityView;
  onChange(view: ActivityView): void;
}

const items: Array<{ id: ActivityView; label: string; icon: typeof Files }> = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "source-control", label: "Source Control", icon: GitBranch },
  { id: "run", label: "Run and Debug", icon: Bug },
  { id: "extensions", label: "Extensions", icon: Boxes },
  { id: "agent", label: "AI Agent", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ActivityBar({ activeView, onChange }: ActivityBarProps): JSX.Element {
  return (
    <nav className="activity-bar" aria-label="Primary">
      {items.map((item) => {
        const Icon = item.icon === Bug && activeView === "run" ? TerminalSquare : item.icon;
        return (
          <button
            key={item.id}
            className={activeView === item.id ? "active" : ""}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </nav>
  );
}
