import { useState } from "react";
import { Link } from "react-router-dom";
import { documents, navigation } from "./documents";
export function DocsNavigation({ slug }: { slug: string }) {
  const [query, setQuery] = useState("");
  return (
    <nav aria-label="Documentation">
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
  );
}
