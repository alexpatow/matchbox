import { homedir } from "node:os";
import { delimiter, join } from "node:path";

// Respect the shell's tools first, then discover conventional Rust installations.
async function toolPath() {
  const paths = [process.env.PATH ?? ""];
  const brew = Bun.which("brew");
  if (brew) {
    const child = Bun.spawn([brew, "--prefix", "rustup"], { stderr: "ignore" });
    const prefix = (await new Response(child.stdout).text()).trim();
    if ((await child.exited) === 0 && prefix) {
      paths.push(join(prefix, "bin"));
    }
  }
  paths.push(join(process.env.CARGO_HOME ?? join(homedir(), ".cargo"), "bin"));
  return paths.join(delimiter);
}

export async function runRust(args: string[]) {
  const path = await toolPath();
  const command = args[0];
  const executable = command && Bun.which(command, { PATH: path });
  if (!executable) {
    const help =
      command === "wasm-bindgen"
        ? "Run bun run setup:rust to install the pinned wasm-bindgen CLI."
        : "Install Rust with rustup or Homebrew, then run bun run setup:rust.";
    throw new Error(`Cannot find ${command ?? "Rust command"}. ${help}`);
  }
  const child = Bun.spawn([executable, ...args.slice(1)], {
    env: { ...process.env, PATH: path },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (await child.exited) {
    throw new Error(`Rust command failed: ${args.join(" ")}`);
  }
}

if (import.meta.main) {
  await runRust(process.argv.slice(2));
}
