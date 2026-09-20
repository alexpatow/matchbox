import { cp, mkdir, rm } from "node:fs/promises";
const name = process.argv[2];
if (!["core", "train", "cli"].includes(name ?? "")) {
  throw new Error("Expected core, train, or cli.");
}
const root = new URL("../", import.meta.url);
const output = new URL(`packages/${name}/docs/`, root);
await rm(new URL(`packages/${name}/dist/`, root), { recursive: true, force: true });
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("docs/", root), output, { recursive: true });
await cp(new URL("skills/matchbox/SKILL.md", root), new URL("agent-skill.md", output));

const skillDirectory = new URL(`packages/${name}/skills/matchbox/`, root);
await mkdir(skillDirectory, { recursive: true });
await cp(new URL("skills/matchbox/SKILL.md", root), new URL("SKILL.md", skillDirectory));

for (const file of ["LICENSE", "THIRD-PARTY-NOTICES.md"]) {
  await cp(new URL(file, root), new URL(`packages/${name}/${file}`, root));
}
