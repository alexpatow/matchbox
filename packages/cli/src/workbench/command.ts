import { spawn } from "node:child_process";
export async function runCommand(
  path: string,
  command: string,
  rest: string[] = [],
  signal?: AbortSignal,
) {
  const child = spawn(
    process.execPath,
    [process.argv[1]!, command, ...rest, "--config", path, "--json"],
    {
      stdio: ["ignore", "pipe", "pipe"],
      ...(signal ? { signal } : {}),
    },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => {
    stdout += data;
  });
  child.stderr.on("data", (data) => {
    stderr = (stderr + data).slice(-16000);
  });
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  if (!stdout.trim()) {
    let message = stderr.trim();
    try {
      message = JSON.parse(message).error;
    } catch {
      /* Native diagnostics may precede the error. */
    }
    throw new Error(message || `${command} exited with code ${code}.`);
  }
  return { ok: code === 0, result: JSON.parse(stdout) };
}
