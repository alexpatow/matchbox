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
      ["pipelines", "Training pipelines"],
    ],
  ],
  [
    "Build and ship",
    [
      ["evaluation", "Evaluation"],
      ["runtime-backends", "Browser runtime"],
      ["react", "React integration"],
      ["cli", "CLI reference"],
    ],
  ],
  [
    "Reference",
    [
      ["parser-api", "Parser definition"],
      ["dataset-format", "Datasets"],
      ["primitives/README", "Training primitives"],
    ],
  ],
] as const;
export function documentLink(href: string | undefined, slug: string) {
  if (!href || /^(https?:|#|\/)/.test(href)) return href;
  const resolved = new URL(href, `https://matchbox.local/docs/${slug}.md`);
  return resolved.pathname.replace(/\.md$/, "") + resolved.hash;
}
