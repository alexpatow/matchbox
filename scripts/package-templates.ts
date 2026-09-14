import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dir, "..");
const target = resolve(root, "packages/train/templates/money/matchbox/money");
await mkdir(target, { recursive: true });
await cp(resolve(root, "examples/money/matchbox/money"), target, { recursive: true });
