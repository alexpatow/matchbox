import { createServer, searchForWorkspaceRoot } from "vite";
import { stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { packageRoot } from "../cli/scaffold-files.js";
import { runCommand } from "./command.js";
import { api } from "./api.js";
import { modifiedAt, type WorkbenchState } from "./state.js";
export async function serveWorkbench(path: string, port: number) {
  const abort = new AbortController();
  const info = (await runCommand(path, "info")).result;
  const taskRoot = dirname(info.task);
  let output: string = info.output;
  const state: WorkbenchState = {
    task: basename(taskRoot),
    ready: false,
    stale: false,
    revision: Date.now(),
    busy: null,
    error: null,
  };
  async function refresh() {
    const modelTime = await stat(output).then(
      (value) => value.mtimeMs,
      () => 0,
    );
    state.ready = modelTime > 0;
    state.stale = modelTime > 0 && (await modifiedAt(taskRoot)) > modelTime;
  }
  await refresh();
  const packagePath = await packageRoot(fileURLToPath(import.meta.url), "@matchbox-ai/train");
  const server = await createServer({
    configFile: false,
    cacheDir: resolve(taskRoot, "../../.matchbox/.workbench-cache"),
    root: resolve(packagePath, "workbench"),
    optimizeDeps: {
      include: [
        "@matchbox-ai/core",
        "@matchbox-ai/core/runtime",
        "react",
        "react/jsx-runtime",
        "react-dom/client",
        "zod",
        "@matchbox-ai/core > @tensorflow/tfjs-core",
        "@matchbox-ai/core > @tensorflow/tfjs-layers",
        "@matchbox-ai/core > @tensorflow/tfjs-backend-cpu",
      ],
    },
    resolve: { dedupe: ["react", "react-dom"] },
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      fs: {
        allow: [searchForWorkspaceRoot(packagePath), resolve(taskRoot, "../.."), dirname(output)],
      },
    },
    plugins: [
      {
        name: "matchbox-workbench",
        handleHotUpdate({ file }) {
          // The workbench reloads model modules after a completed export, preserving UI state.
          if (file.startsWith(`${taskRoot}/`) || file.startsWith(`${dirname(output)}/`)) return [];
        },
        resolveId(id) {
          if (id.startsWith("/__matchbox/model.ts")) return `\0${id}`;
        },
        load(id) {
          if (id.startsWith("\0/__matchbox/model.ts"))
            return `export { default } from ${JSON.stringify(output.replace(/\.matchbox$/, ".ts") + `?v=${state.revision}`)};`;
        },
        configureServer(server) {
          server.middlewares.use(
            api(path, state, abort.signal, async () => {
              output = (await runCommand(path, "info")).result.output;
              state.revision = Date.now();
              server.moduleGraph.invalidateAll();
              await refresh();
            }),
          );
        },
      },
    ],
  });
  server.watcher.add([taskRoot, dirname(output)]);
  let timer: ReturnType<typeof setTimeout>;
  const onChange = (file: string) => {
    if (file === output.replace(/\.matchbox$/, ".ts") && !state.busy) {
      state.revision = Date.now();
      server.moduleGraph.invalidateAll();
      void refresh().catch((error) => {
        state.error = String(error);
      });
      return;
    }
    if (!file.startsWith(`${taskRoot}/`)) return;
    state.stale = state.ready;
    clearTimeout(timer);
    timer = setTimeout(() => {
      void refresh().catch((error) => {
        state.error = String(error);
      });
    }, 100);
  };
  server.watcher.on("all", (_event, file) => onChange(file));
  await server.listen();
  const address = server.httpServer!.address();
  const url = `http://127.0.0.1:${typeof address === "object" && address ? address.port : port}`;
  return {
    url,
    state,
    close: async () => {
      clearTimeout(timer);
      abort.abort();
      await server.close();
    },
  };
}
