import { stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return false;
    throw error;
  }
}
/** Named task modules have one flat or directory-backed TypeScript entry point. */
export async function findEntry(root: string, name: string): Promise<string | undefined> {
  const base = resolve(root, name);
  const candidates = [`${base}.ts`, resolve(base, `${basename(base)}.ts`)];
  const found = (await Promise.all(candidates.map(isFile)))
    .map((exists, index) => (exists ? candidates[index] : undefined))
    .filter((path): path is string => path !== undefined);
  if (found.length > 1)
    throw new Error(`Conflicting task entry points: ${found.join(" and ")}. Keep only one.`);
  return found[0];
}
/** Explicit filenames stay exact; extensionless references use the named entry convention. */
export async function resolveModule(root: string, reference: string): Promise<string> {
  if (extname(reference)) return resolve(root, reference);
  // Missing training modules are reported when imported, so artifact evaluation needs no recipe.
  return (await findEntry(root, reference)) ?? resolve(root, `${reference}.ts`);
}
