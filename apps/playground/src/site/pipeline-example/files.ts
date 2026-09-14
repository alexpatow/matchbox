import parser from "../../../../../examples/money/matchbox/money/parser.ts?raw";
import pipeline from "../../../../../examples/money/matchbox/money/pipeline.ts?raw";
import recipe from "../../../../../examples/money/matchbox/money/recipe.ts?raw";
import decode from "../../../../../examples/money/matchbox/money/decode/decode.ts?raw";
// oxlint-disable-next-line import/default -- Vite raw imports export source text, regardless of module exports.
import numbers from "../../../../../examples/money/matchbox/money/decode/number-words.ts?raw";
export const files = [
  { name: "parser.ts", description: "Defines valid input and output.", code: parser },
  {
    name: "pipeline.ts",
    description:
      "Selects the token model. Matchbox discovers the named recipe and decode entry points.",
    code: pipeline,
  },
  {
    name: "recipe.ts",
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
    code: '{\n  "twenty dollars": ["AMOUNT", "USD"],\n  "not € 12.50": ["REJECT", "EUR", "AMOUNT"]\n}',
  },
  {
    name: "data/train-rejections.json",
    description:
      "An excerpt of negative training rows. Their token annotations must decode to null; evaluation challenges stay separate.",
    code: '[{ "input": "not € 12.50", "output": null }]',
  },
  {
    name: "decode/decode.ts",
    description:
      "Runs in the browser. Assembles the model’s predicted labels into an amount and currency, or returns null.",
    code: decode,
  },
  {
    name: "decode/number-words.ts",
    description:
      "Application-owned number conversion. This dictionary and arithmetic are authored code, not learned weights.",
    code: numbers,
  },
  {
    name: "app.ts",
    description:
      "Imports the generated TypeScript module and handles a validated result or uncertainty.",
    code: 'import money from "./.matchbox/money/model";\n\nconst result = await money.parse("twenty dollars");\n\nif (result.status === "ok") {\n  console.log(result.value);\n} else {\n  console.log(result.reason);\n}',
  },
];
