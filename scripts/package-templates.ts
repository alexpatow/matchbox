import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dir, "..");
const target = resolve(root, "packages/cli/templates/money/matchbox/money");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(resolve(root, "examples/money/matchbox/money"), target, { recursive: true });
