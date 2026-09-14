import type { IncomingMessage, ServerResponse } from "node:http";
import type { WorkbenchState } from "./state.js";
import { runCommand } from "./command.js";
export function api(
  path: string,
  state: WorkbenchState,
  signal: AbortSignal,
  trained: () => Promise<void>,
) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith("/api/")) return next();
    const reply = (status: number, value: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(value));
    };
    try {
      if (req.method === "GET" && req.url === "/api/state") return reply(200, state);
      if (req.method !== "POST") return reply(405, { error: "Use POST." });
      if (
        req.headers.origin !== `http://${req.headers.host}` ||
        !req.headers["content-type"]?.startsWith("application/json")
      )
        return reply(403, { error: "Use the local workbench." });
      const command = req.url.slice(5);
      if (!["train", "eval", "inspect", "save"].includes(command))
        return reply(404, { error: "Unknown operation." });
      if (state.busy) return reply(409, { error: `Wait for ${state.busy} to finish.` });
      state.busy = command;
      state.error = null;
      try {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 65536) throw new Error("Request exceeds 64 KB.");
        }
        const data = JSON.parse(body);
        if (["inspect", "save"].includes(command) && typeof data.input !== "string")
          throw new Error("An input string is required.");
        const args =
          command === "save"
            ? [data.input, JSON.stringify(data.output)]
            : command === "inspect"
              ? [data.input]
              : [];
        const response = await runCommand(path, command, args, signal);
        if (command === "train" && response.ok) await trained();
        reply(200, response);
      } finally {
        state.busy = null;
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      reply(400, { error: state.error });
    }
  };
}
