import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SiteHeader, SiteFooter } from "@/site";
import { documents } from "./documents";
import { DocsNavigation } from "./docs-navigation";
import { DocsMarkdown } from "./docs-markdown";
import { headings } from "./headings";
export function DocsApp() {
  const { pathname, hash } = useLocation();
  const slug = decodeURI(pathname.slice(6)) || "getting-started";
  const source = documents[slug];
  useEffect(() => {
    document.title = `${source?.match(/^# (.+)/m)?.[1] ?? "Documentation"} · Matchbox`;
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [slug, hash, source]);
  return (
    <div className="workspace docs-workspace">
      <SiteHeader />
      <div className="docs-layout">
        <aside>
          <DocsNavigation slug={slug} />
        </aside>
        <main className="doc-content">
          {source ? (
            <>
              {headings(source).length > 1 && (
                <details className="doc-outline">
                  <summary>On this page</summary>
                  <nav aria-label="On this page">
                    {headings(source).map((heading) => (
                      <Link key={heading.id} to={`#${heading.id}`}>
                        {heading.title}
                      </Link>
                    ))}
                  </nav>
                </details>
              )}
              <DocsMarkdown source={source} slug={slug} />
            </>
          ) : (
            <>
              <h1>Page not found.</h1>
              <p>
                <Link to="/docs/getting-started">Go to getting started.</Link>
              </p>
            </>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
