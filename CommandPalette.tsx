import { useEffect, useMemo, useState, type JSX } from "react";

interface Command {
  id: string;
  label: string;
  run(): void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: Command[];
  onClose(): void;
}

export function CommandPalette({
  open,
  commands,
  onClose,
}: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = useMemo(
    () =>
      commands.filter((command) =>
        command.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [commands, query],
  );

  if (!open) return null;

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="command-palette"
        role="dialog"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "Enter" && filtered[0]) {
              filtered[0].run();
              onClose();
            }
          }}
          placeholder="Run command..."
        />
        <div>
          {filtered.map((command) => (
            <button
              key={command.id}
              type="button"
              onClick={() => {
                command.run();
                onClose();
              }}
            >
              {command.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
