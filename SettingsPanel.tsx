import { useEffect, useState, type JSX } from "react";
import type { FuseSettings } from "@fuse/config";

interface SettingsPanelProps {
  settings: FuseSettings | undefined;
  onSettingsChanged(settings: FuseSettings): void;
  onError(message: string | undefined): void;
}

export function SettingsPanel({
  settings,
  onSettingsChanged,
  onError,
}: SettingsPanelProps): JSX.Element {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(settings?.ai.model ?? "");
  const [baseUrl, setBaseUrl] = useState(settings?.ai.baseUrl ?? "");
  const [temperature, setTemperature] = useState(settings?.ai.temperature ?? 0.2);
  const [hasSessionKey, setHasSessionKey] = useState(false);

  useEffect(() => {
    void window.fuse.settings.get().then((result) => {
      onSettingsChanged(result.settings);
      setModel(result.settings.ai.model);
      setBaseUrl(result.settings.ai.baseUrl);
      setTemperature(result.settings.ai.temperature);
      setHasSessionKey(result.secrets.hasAiApiKey);
    });
  }, [onSettingsChanged]);

  const save = async () => {
    try {
      const updated = await window.fuse.settings.update({
        ai: { model, baseUrl, temperature },
      });
      if (apiKey.trim()) {
        await window.fuse.settings.setAiApiKey(apiKey.trim());
        setApiKey("");
        setHasSessionKey(true);
      }
      onSettingsChanged(updated);
      onError(undefined);
    } catch (err) {
      onError(String(err));
    }
  };

  return (
    <section className="panel-section settings-panel">
      <h2>Settings</h2>
      <div className="settings-group">
        <h3>AI</h3>
        <label>
          Base URL
          <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
        </label>
        <label>
          Model
          <input value={model} onChange={(event) => setModel(event.target.value)} />
        </label>
        <label>
          Temperature
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />
        </label>
        <label>
          API key
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={hasSessionKey ? "Session key configured" : "Stored for this session only"}
          />
        </label>
        <p className="muted">
          API keys are kept in memory for this session in the current implementation. Persistent OS
          keychain storage is planned before release builds.
        </p>
        <button type="button" onClick={() => void save()}>
          Save Settings
        </button>
      </div>
    </section>
  );
}
