import type { Agent } from "package-manager-detector";
import { commandText } from "./install.js";

export function integrationGuide(
  name: string,
  template: string,
  framework: string,
  manager: Agent,
) {
  const run = (command: string) =>
    commandText(manager, "execute-local", ["matchbox-ai", command, name]);
  return `# ${name}\n\nThis task belongs to your ${framework} application. Your app keeps its own development server.\n\n${manager.startsWith("pnpm") ? "Before training, run `pnpm approve-builds` and select `@tensorflow/tfjs-node` to install the native training backend.\n\n" : ""}Run from the application root:\n\n\`\`\`sh\n${run("dev")}\n\`\`\`\n\n${template === "blank" ? "Replace parser.ts and add independent training, validation, and test examples before training. The starter pipeline explicitly classifies known field values from word features." : "The model learns token labels. lib/recipe.ts supplies training supervision from data/train-spans.json; lib/decode.ts converts recognized spans into application values. New training inputs also need matching token labels. The decoder supports English number words below one hundred and four currencies; $ means USD."}\n\nTrain explicitly using the workbench or \`${run("train")}\`. Check independent test results with \`${run("eval")}\`.\n\n## Use in React or Next.js\n\nThe generated TypeScript wrapper works without changing your bundler configuration. Adjust the relative import for your component's location. In Next.js, keep inference in a client component:\n\n\`\`\`tsx\n"use client";\n\nimport { useMatchbox } from "@matchbox-ai/core/react";\nconst loadModel = () => import("./.matchbox/${name}/model");\n\nexport function ModelInput() {\n  const { parse, status } = useMatchbox(loadModel);\n  return <button disabled={status !== "ready"} onClick={async () => {\n    const result = await parse("twenty dollars");\n    console.log(result);\n  }}>Try the model</button>;\n}\n\`\`\`\n\nTrain before running your app build. The ignored .matchbox/ directory contains the model and report. Training dependencies stay outside the client bundle. Confidence is an uncalibrated model score; handle uncertain results in your app.\n`;
}
