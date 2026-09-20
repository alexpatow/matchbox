import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { SketchApp } from "./sketch";
import { ExamplesApp } from "./examples";
import { DocsApp } from "./docs";
import { App } from "./app";
import { RouteEffects, SiteAnalytics } from "./site";
import "./styles.css";
import "./site.css";
const root = document.getElementById("root");
if (!root) {
  throw new Error("The example root element is missing.");
}
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <RouteEffects />
      {import.meta.env.PROD && <SiteAnalytics />}
      <Routes>
        <Route path="/docs/*" element={<DocsApp />} />
        <Route path="/examples/sketch" element={<SketchApp />} />
        <Route path="/examples" element={<ExamplesApp />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
