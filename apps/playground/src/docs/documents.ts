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
      ["pipelines", "Choose a pipeline"],
      ["evaluation", "Evaluate a model"],
    ],
  ],
  [
    "Examples",
    [
      ["examples/money", "Money"],
      ["examples/time", "Date, time & duration"],
    ],
  ],
  [
    "API reference",
    [
      ["reference/README", "All exports"],
      ["parser-api", "defineParser"],
      ["dataset-format", "parseDatasets"],
      ["reference/pipeline", "Pipeline API"],
      ["reference/supervision", "Tokens & decoders"],
      ["reference/training", "train & evaluate"],
      ["reference/runtime", "Parser runtime"],
      ["react", "useMatchbox"],
      ["reference/vite", "Vite plugin"],
      ["reference/configuration", "Configuration"],
    ],
  ],
  ["CLI", [["cli", "Commands & options"]]],
] as const;
export function documentLink(href: string | undefined, slug: string) {
  if (!href || /^(https?:|#|\/)/.test(href)) return href;
  const resolved = new URL(href, `https://matchbox.local/docs/${slug}.md`);
  return resolved.pathname.replace(/\.md$/, "") + resolved.hash;
}
