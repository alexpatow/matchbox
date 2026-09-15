import { Children, isValidElement, type ReactNode } from "react";
export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}
export function plainText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? plainText(child.props.children)
        : String(child),
    )
    .join("");
}
export function headings(source: string) {
  let fenced = false;
  return source.split("\n").flatMap((line) => {
    if (/^```/.test(line)) {
      fenced = !fenced;
    }
    const match = !fenced && /^## (.+)$/.exec(line);
    return match ? [{ title: match[1]!.replace(/`/g, ""), id: headingId(match[1]!) }] : [];
  });
}
