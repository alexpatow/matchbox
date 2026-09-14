import parser from "../../../../../examples/money/matchbox/money/parser.ts?raw";
import pipeline from "../../../../../examples/money/matchbox/money/pipeline.ts?raw";
import recipe from "../../../../../examples/money/matchbox/money/lib/recipe.ts?raw";
import decode from "../../../../../examples/money/matchbox/money/lib/decode.ts?raw";
// oxlint-disable-next-line import/default -- Vite raw imports export source text, regardless of module exports.
import numbers from "../../../../../examples/money/matchbox/money/lib/number-words.ts?raw";
// oxlint-disable-next-line import/default -- Vite raw imports export source text, regardless of module exports.
import helpers from "../../../../../examples/money/matchbox/money/lib/index.ts?raw";
export const files = [
  { name: "parser.ts", description: "Defines valid input and output.", code: parser },
  {
    name: "pipeline.ts",
    description: "Selects the token model and points to its training recipe and browser decoder.",
    code: pipeline,
  },
  {
    name: "lib/recipe.ts",
    description:
      "Runs during training. Supplies the tokenizer, label vocabulary, and annotations for each training input.",
    code: recipe,
  },
  {
    name: "data/train.jsonl",
    description: "One training row from the money dataset. Evaluation examples live separately.",
    code: '{"input":"twenty dollars","output":{"amount":20,"currency":"USD","approximate":false}}',
  },
  {
    name: "data/train-spans.json",
    description:
      "An excerpt of the training annotations. These labels line up with the tokens “twenty” and “dollars”.",
    code: '{\n  "twenty dollars": ["AMOUNT", "USD"]\n}',
  },
  {
    name: "lib/decode.ts",
    description:
      "Runs in the browser. Assembles the model’s predicted labels into an amount and currency, or returns null.",
    code: decode,
  },
  {
    name: "lib/number-words.ts",
    description:
      "Application-owned number conversion. This dictionary and arithmetic are authored code, not learned weights.",
    code: numbers,
  },
  {
    name: "lib/index.ts",
    description: "Re-exports the helper used by the decoder.",
    code: helpers,
  },
  {
    name: "app.ts",
    description:
      "Imports the generated TypeScript module and handles a validated result or uncertainty.",
    code: 'import money from "./.matchbox/money/model";\n\nconst result = await money.parse("twenty dollars");\n\nif (result.status === "ok") {\n  console.log(result.value);\n} else {\n  console.log(result.reason);\n}',
  },
];
