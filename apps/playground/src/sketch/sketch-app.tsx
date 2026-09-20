import { SiteHeader, SiteFooter } from "@/site";
import { SketchDemo } from "./sketch-demo";
import "../examples/examples.css";
export function SketchApp() {
  return (
    <main className="workspace examples-page sketch-page">
      <SiteHeader />
      <SketchDemo standalone />
      <SiteFooter />
    </main>
  );
}
