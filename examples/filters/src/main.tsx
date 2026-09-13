import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import { TrainingApp } from "./training";
import { App } from "./app";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("The example root element is missing.");

createRoot(root).render(
  <StrictMode>{window.location.pathname === "/training" ? <TrainingApp /> : <App />}</StrictMode>,
);
