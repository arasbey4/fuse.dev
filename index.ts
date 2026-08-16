export interface EditorDocument {
  path: string;
  content: string;
  savedContent: string;
  mtimeMs: number;
  language: string;
}

export function isDirty(document: EditorDocument): boolean {
  return document.content !== document.savedContent;
}
