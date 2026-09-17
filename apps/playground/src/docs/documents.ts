const sources = import.meta.glob<string>("../../../../docs/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
export const documents = Object.fromEntries(
  Object.entries(sources).map(([path, source]) => [
    path.replace("../../../../docs/", "").replace(/\.md$/, ""),
    source,
  ]),
);
export const navigation = [
  [
    "Start here",
    [
      ["getting-started", "Getting started"],
      ["project-structure", "Project structure"],
    ],
  ],
  [
    "Training",
    [
      ["training", "Train a model"],
      ["pipelines", "Choose a pipeline"],
      ["dataset-format", "Prepare datasets"],
      ["reference/pipeline", "Pipeline API"],
      ["reference/supervision", "Tokens & decoders"],
      ["primitives/recurrent-token-classifier", "Recurrent classifiers"],
      ["reference/training", "train API"],
    ],
  ],
  [
    "Evaluating",
    [
      ["evaluation", "Evaluate a model"],
      ["reference/evaluation", "evaluate API"],
      ["example-evaluation", "Example results"],
    ],
  ],
  [
    "Use in your app",
    [
      ["reference/runtime", "Parser runtime"],
      ["runtime-backends", "CPU & WebGPU"],
      ["react", "React integration"],
      ["reference/vite", "Vite plugin"],
    ],
  ],
  [
    "Examples",
    [
      ["examples/money", "Money"],
      ["examples/time", "Date, time & duration"],
      ["examples/lexer", "Syntax highlighting"],
    ],
  ],
  [
    "Reference",
    [
      ["reference/README", "All exports"],
      ["parser-api", "defineParser"],
      ["reference/configuration", "Configuration"],
      ["cli", "CLI commands & options"],
    ],
  ],
] as const;
export function documentLink(href: string | undefined, slug: string) {
  if (!href || /^(https?:|#|\/)/.test(href)) {
    return href;
  }
  const resolved = new URL(href, `https://matchbox.local/docs/${slug}.md`);
  return resolved.pathname.replace(/\.md$/, "") + resolved.hash;
}
