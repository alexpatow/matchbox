import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { documents, navigation } from "./documents";
export function DocsNavigation({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <>
      <button
        className="docs-menu-toggle"
        aria-expanded={open}
        aria-controls="docs-navigation"
        onClick={() => setOpen(!open)}
      >
        Documentation <ChevronDown className="site-icon" aria-hidden="true" />
      </button>
      <nav id="docs-navigation" aria-label="Documentation" data-open={open}>
        <label className="docs-search-label" htmlFor="docs-search">
          Find a page
        </label>
        <input
          id="docs-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search docs…"
        />
        {navigation.map(([group, pages]) => {
          const visible = pages.filter(
            ([path, title]) =>
              !query.trim() ||
              `${title} ${documents[path]}`.toLowerCase().includes(query.trim().toLowerCase()),
          );
          return visible.length ? (
            <div key={group}>
              <p>{group}</p>
              {visible.map(([path, title]) => (
                <Link
                  key={path}
                  to={`/docs/${path}`}
                  aria-current={slug === path ? "page" : undefined}
                >
                  {title}
                </Link>
              ))}
            </div>
          ) : null;
        })}
        {query &&
          !navigation.some(([, pages]) =>
            pages.some(([path, title]) =>
              `${title} ${documents[path]}`.toLowerCase().includes(query.trim().toLowerCase()),
            ),
          ) && <p>No matching pages.</p>}
      </nav>
    </>
  );
}
