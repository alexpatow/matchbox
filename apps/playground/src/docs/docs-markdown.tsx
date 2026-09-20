import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { documentLink } from "./documents";
import { headingId, plainText } from "./headings";
export function DocsMarkdown({ source, slug }: { source: string; slug: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => <h2 id={headingId(plainText(children))}>{children}</h2>,
        h3: ({ children }) => <h3 id={headingId(plainText(children))}>{children}</h3>,
        a: ({ href, children }) => {
          const target = documentLink(href, slug);
          return target?.startsWith("/docs/") && !/\.md(?:[?#]|$)/.test(target) ? (
            <Link to={target}>{children}</Link>
          ) : (
            <a href={target}>{children}</a>
          );
        },
      }}
    >
      {source}
    </Markdown>
  );
}
