import parser from "../../../../../examples/money/matchbox/money/parser.ts?raw";
import pipeline from "../../../../../examples/money/matchbox/money/pipeline.ts?raw";
import recipe from "../../../../../examples/money/matchbox/money/recipe.ts?raw";
import decode from "../../../../../examples/money/matchbox/money/decode/decode.ts?raw";
export const files = [
  {
    name: "app.ts",
    description:
      "Imports the generated TypeScript module and handles a validated result or uncertainty.",
    code: 'import money from "./.matchbox/money/model";\n\nconst result = await money.parse("twenty dollars");\n\nif (result.status === "ok") {\n  console.log(result.value);\n} else {\n  console.log(result.reason);\n}',
  },
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
    name: "decode/decode.ts",
    description:
      "Runs in the browser. Assembles the model’s predicted labels into an amount and currency, or returns null.",
    code: decode,
  },
];
