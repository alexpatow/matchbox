import { loadConfig } from "@matchbox-ai/train/project";
import { terminal } from "./terminal.js";
import { metrics, print } from "./output.js";
export async function trainCommand(path: string, json = false, verbose = false) {
  const { config } = await loadConfig(path);
  const view = json
    ? null
    : terminal("Training", [path, "Validating examples and preparing training…"]);
  try {
    const { train } = await import("@matchbox-ai/train");
    const result = await train(path, {
      onProgress: (epoch, loss) => {
        if (json) return;
        if (verbose) console.error(`Epoch ${epoch} · loss ${loss.toFixed(6)}`);
        else if (epoch === 1 || epoch % 10 === 0) view?.update([path, `Training · epoch ${epoch}`]);
      },
    });
    view?.stop();
    if ("report" in result) {
      if (json) print(result.report, true);
      else {
        const passed = result.report.quantized.exactAccuracy >= config.minAccuracy;
        console.log(
          passed
            ? "\nModel packaged. Test accuracy meets the threshold."
            : "\nModel packaged after validation. Independent test accuracy is below the threshold.",
        );
        metrics(result.report.quantized);
        console.log(
          `  Size          ${result.report.bytes.toLocaleString()} bytes\n  Artifact      ${result.output}\n  Import        ${result.output!.replace(/\.matchbox$/, ".ts")}\n\nOpen matchbox-ai dev to try it in your browser.`,
        );
      }
    }
  } finally {
    view?.stop();
  }
}
