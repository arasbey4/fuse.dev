export class SessionSecretStore {
  private aiApiKey: string | undefined;

  setAiApiKey(apiKey: string): void {
    this.aiApiKey = apiKey;
  }

  getAiApiKey(): string | undefined {
    return this.aiApiKey;
  }

  hasAiApiKey(): boolean {
    return Boolean(this.aiApiKey);
  }
}
