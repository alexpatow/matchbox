import { readdir, stat } from "node:fs/promises";
export async function modifiedAt(directory: string): Promise<number> {
  const entries = await readdir(directory, { withFileTypes: true });
  const times = await Promise.all(
    entries.map(async (entry) => {
      const path = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        return 0;
      }
      return entry.isDirectory() ? modifiedAt(path) : (await stat(path)).mtimeMs;
    }),
  );
  return Math.max(0, ...times);
}
export interface WorkbenchState {
  task: string;
  ready: boolean;
  stale: boolean;
  revision: number;
  busy: string | null;
  error: string | null;
}
