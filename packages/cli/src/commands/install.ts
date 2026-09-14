import { spawn } from "node:child_process";
import { detect, getUserAgent } from "package-manager-detector/detect";
import { resolveCommand } from "package-manager-detector/commands";
import type { Agent } from "package-manager-detector";

export async function packageManager(root: string) {
  const detected = await detect({
    cwd: root,
    strategies: ["packageManager-field", "devEngines-field", "lockfile", "install-metadata"],
  });
  return detected?.agent ?? getUserAgent() ?? "bun";
}

export function packageCommand(
  agent: Agent,
  action: "install" | "execute-local",
  args: string[] = [],
) {
  const resolved = resolveCommand(agent, action, args);
  if (!resolved) {
    throw new Error(`Cannot resolve ${action} for ${agent}.`);
  }
  return resolved;
}

export function commandText(
  agent: Agent,
  action: "install" | "execute-local",
  args: string[] = [],
) {
  const { command, args: flags } = packageCommand(agent, action, args);
  return [command, ...flags].join(" ");
}

export async function installDependencies(root: string, agent: Agent) {
  const { command, args } = packageCommand(agent, "install");
  const retry = commandText(agent, "install");
  console.error(`Installing dependencies with ${retry}…`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      // Keep installer output out of the CLI's JSON result.
      stdio: ["inherit", process.stderr, process.stderr],
    });
    const fail = (reason: string) =>
      reject(
        new Error(
          `Dependencies were not installed: ${reason}. Your scaffold is saved. Run "${retry}" in ${root} to retry.`,
        ),
      );
    child.once("error", (error) => fail(error.message));
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        fail(signal ? `terminated by ${signal}` : `exit code ${code}`);
      }
    });
  });
}
