import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
export function RouteEffects() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith("/docs")) {
      document.title = "Matchbox · Tiny models for the browser";
    }
  }, [pathname]);
  return null;
}
