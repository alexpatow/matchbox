import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useLocation } from "react-router-dom";

export function SiteAnalytics() {
  const { pathname } = useLocation();
  return (
    <>
      <Analytics route={pathname} path={pathname} />
      <SpeedInsights route={pathname} />
    </>
  );
}
