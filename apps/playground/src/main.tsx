import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import { TrainingApp } from "./training";
import { App } from "./app";
import "./styles.css";
import "./site.css";

const DocsApp = lazy(() => import("./docs").then((module) => ({ default: module.DocsApp })));

const root = document.getElementById("root");
if (!root) throw new Error("The example root element is missing.");

createRoot(root).render(
  <StrictMode>
    {window.location.pathname.startsWith("/docs") ? (
      <Suspense
        fallback={
          <main className="workspace">
            <p>Loading documentation…</p>
          </main>
        }
      >
        <DocsApp />
      </Suspense>
    ) : window.location.pathname === "/training" ? (
      <TrainingApp />
    ) : (
      <App />
    )}
  </StrictMode>,
);
