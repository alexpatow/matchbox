import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/site";
import { documents, navigation, documentLink } from "./documents";
export function DocsApp() {
  const { pathname } = useLocation();
  const slug = decodeURI(pathname.slice(6)) || "getting-started";
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${documents[slug]?.match(/^# (.+)/m)?.[1] ?? "Documentation"} · Matchbox`;
  }, [slug]);
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
                  <Link
                    key={path}
                    to={`/docs/${path}`}
                    aria-current={slug === path ? "page" : undefined}
                  >
                    {title}
                  </Link>
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
                  a: ({ href, children }) => {
                    const target = documentLink(href, slug);
                    return target?.startsWith("/docs/") ? (
                      <Link to={target}>{children}</Link>
                    ) : (
                      <a href={target}>{children}</a>
                    );
                  },
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
