import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { TrainingApp } from "./training";
import { DocsApp } from "./docs";
import { App } from "./app";
import { RouteEffects } from "./site";
import "./styles.css";
import "./site.css";
const root = document.getElementById("root");
if (!root) throw new Error("The example root element is missing.");
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <RouteEffects />
      <Routes>
        <Route path="/docs/*" element={<DocsApp />} />
        <Route path="/training" element={<TrainingApp />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
