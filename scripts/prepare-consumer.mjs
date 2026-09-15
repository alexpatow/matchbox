import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".packed-smoke", { recursive: true });
await writeFile(
  ".packed-smoke/package.json",
  JSON.stringify({ name: "matchbox-consumer", private: true, type: "module" }) + "\n",
);
