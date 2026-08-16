import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS, FuseSettingsSchema, type FuseSettings } from "@fuse/config";

export class SettingsStore {
  private settings: FuseSettings = DEFAULT_SETTINGS;
  private readonly filePath: string;

  constructor(userDataPath: string) {
    this.filePath = path.join(userDataPath, "settings.json");
  }

  async load(): Promise<FuseSettings> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      this.settings = FuseSettingsSchema.parse(deepMerge(DEFAULT_SETTINGS, JSON.parse(raw)));
    } catch {
      this.settings = DEFAULT_SETTINGS;
    }
    return this.settings;
  }

  get(): FuseSettings {
    return this.settings;
  }

  async update(patch: unknown): Promise<FuseSettings> {
    this.settings = FuseSettingsSchema.parse(deepMerge(this.settings, patch));
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.settings, null, 2), "utf-8");
    return this.settings;
  }
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source ?? target;
  }

  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    result[key] = deepMerge(result[key], value);
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
