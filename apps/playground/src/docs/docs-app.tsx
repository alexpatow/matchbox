import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/site";
import { documents, navigation, documentLink } from "./documents";
export function DocsApp() {
  const slug = decodeURI(window.location.pathname.slice(6)) || "getting-started";
  const source = documents[slug];
  return (
    <div className="workspace docs-workspace">
      <SiteHeader />
      <div className="docs-layout">
        <aside>
          <nav aria-label="Documentation">
            {navigation.map(([group, pages]) => (
              <div key={group}>
                <p>{group}</p>
                {pages.map(([path, title]) => (
                  <a
                    key={path}
                    href={`/docs/${path}`}
                    aria-current={slug === path ? "page" : undefined}
                  >
                    {title}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="doc-content">
          {source ? (
            <>
              <p className="eyebrow">Matchbox documentation</p>
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => <a href={documentLink(href, slug)}>{children}</a>,
                }}
              >
                {source}
              </Markdown>
              <p className="doc-source">These guides also ship with the Matchbox packages.</p>
            </>
          ) : (
            <>
              <h1>Page not found.</h1>
              <p>
                <a href="/docs/getting-started">Go to getting started.</a>
              </p>
            </>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
