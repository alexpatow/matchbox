import { FilterDemo } from "./filter-demo";
import { Hero, FrameworkStory, SiteHeader, SiteFooter, ModelFootprint, BrowserLlm } from "@/site";
export function App() {
  return (
    <main className="workspace landing">
      <SiteHeader />
      <Hero />
      <FilterDemo />
      <ModelFootprint />
      <FrameworkStory />
      <BrowserLlm />
      <SiteFooter />
    </main>
  );
}
