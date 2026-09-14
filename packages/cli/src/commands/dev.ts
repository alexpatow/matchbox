import open from "open";
import { discover } from "@matchbox-ai/train/project";
import { serveWorkbench } from "../workbench/index.js";
import { choose, terminal } from "./terminal.js";
import { taskNames } from "./overview.js";
export async function develop(config?: string, requestedPort = "4190", launch = true) {
  const port = Number(requestedPort);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("Use a port from 0 to 65535.");
  if (!config && process.stdin.isTTY) {
    const names = await taskNames();
    if (names.length > 1)
      config = await choose(
        "Choose a task",
        names.map((name) => ({ label: name, value: name })),
      );
  }
  const path = await discover(config);
  const server = await serveWorkbench(path, port);
  const lines = () => [
    server.url,
    `Task: ${server.state.task}`,
    server.state.busy
      ? `Running ${server.state.busy}…`
      : server.state.stale
        ? "Source changed. Train to update the model."
        : server.state.ready
          ? "Model ready. Predictions run in your browser."
          : "Train the task to create its first model.",
    "Your app runs separately. Press Ctrl+C to stop.",
  ];
  const view = terminal("Workbench", lines());
  let previous = JSON.stringify(lines());
  const timer = setInterval(() => {
    const next = JSON.stringify(lines());
    if (next !== previous) {
      previous = next;
      view.update(lines());
    }
  }, 500);
  const close = async () => {
    clearInterval(timer);
    view.stop();
    await server.close();
  };
  process.once("SIGINT", () => {
    void close();
  });
  process.once("SIGTERM", () => {
    void close();
  });
  if (launch) await open(server.url).catch(() => {});
}
