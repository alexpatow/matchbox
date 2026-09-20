import parser from "../../../../../examples/filters/matchbox/filters/parser.ts?raw";
import pipeline from "../../../../../examples/filters/matchbox/filters/pipeline.ts?raw";
import recipe from "../../../../../examples/filters/matchbox/filters/recipe.ts?raw";
import decode from "../../../../../examples/filters/matchbox/filters/decode/decode.ts?raw";
export const files = [
  {
    name: "app.ts",
    description:
      "Imports the generated TypeScript module and handles a validated result or uncertainty.",
    code: 'import filters from "./.matchbox/filters/model";\n\nconst result = await filters.parse("active Swedish customers over 50k ARR");\n\nif (result.status === "ok") {\n  console.log(result.value);\n} else {\n  console.log(result.reason);\n}',
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
    description: "One training row from the filter dataset. Evaluation examples live separately.",
    code: '{"input":"active","output":{"field":"status","operator":"eq","value":"active"}}',
  },
  {
    name: "decode/decode.ts",
    description:
      "Runs in the browser. Assembles predicted labels into filter clauses, or returns null.",
    code: decode,
  },
];
