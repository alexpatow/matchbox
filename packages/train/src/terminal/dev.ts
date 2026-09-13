import { createInterface } from "node:readline/promises";
import { spawn } from "node:child_process";
import { discover } from "../project/index.js";
import { initialize } from "./init.js";
async function child(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const processChild = spawn(process.execPath, [process.argv[1]!, ...args], { stdio: "inherit" });
    processChild.once("error", reject);
    processChild.once("exit", () => resolve());
  });
}
export async function develop(config?: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Interactive mode needs a terminal. Use train, eval, parse, or inspect with --json in scripts.",
    );
  let path: string;
  try {
    path = await discover(config);
  } catch (error) {
    if (config) throw error;
    await initialize();
    return;
  }
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  let lastInput: string | undefined;
  console.log(
    `\nMatchbox · ${path}\n\nType text to parse it locally.\n/train  /eval  /inspect [text]  /info  /save <correct JSON>  /help  /exit\n`,
  );
  try {
    for (;;) {
      const line = (await prompt.question("› ")).trim();
      if (!line) continue;
      if (line === "/exit") break;
      const space = line.indexOf(" ");
      const name = space < 0 ? line : line.slice(0, space);
      const argument = space < 0 ? "" : line.slice(space + 1);
      if (name === "/help") {
        console.log(
          "Type text to parse. /inspect shows recognition. /save <JSON> writes an explicit correction for your last input to training data. /train rebuilds the model; /eval checks held-out data. /info shows paths. /exit leaves the session.",
        );
        continue;
      }
      let args: string[];
      if (["/train", "/eval", "/info"].includes(name)) args = [name.slice(1)];
      else if (name === "/inspect") {
        const input = argument || lastInput;
        if (!input) {
          console.log("Enter text first, or use /inspect <text>.");
          continue;
        }
        args = ["inspect", input];
      } else if (name === "/save") {
        if (!lastInput || !argument) {
          console.log("Parse an input first, then use /save <correct JSON>.");
          continue;
        }
        args = ["save", lastInput, argument];
      } else if (line.startsWith("/")) {
        console.log("Unknown command. Use /help.");
        continue;
      } else {
        lastInput = line;
        args = ["parse", line];
      }
      // Each operation gets fresh modules, so task and config edits take effect without restarting.
      prompt.pause();
      await child([...args, "--config", path]);
      prompt.resume();
    }
  } finally {
    prompt.close();
  }
}
