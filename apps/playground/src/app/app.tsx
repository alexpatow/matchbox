import { FilterDemo } from "./filter-demo";
import { Hero, FrameworkStory, SiteHeader, SiteFooter } from "@/site";
export function App() {
  return (
    <main className="workspace landing">
      <SiteHeader />
      <Hero />
      <FilterDemo />
      <FrameworkStory />
      <SiteFooter />
    </main>
  );
}
