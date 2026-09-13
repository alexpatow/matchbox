# @matchbox-ai/core/react

Load typed Matchbox parsers in React with `useMatchbox`.

```tsx
import { useMatchbox } from "@matchbox-ai/core/react";

const loadFilters = () => import("./generated/filters.matchbox");

function Search() {
  const parser = useMatchbox(loadFilters);
  return <input onChange={async (event) => console.log(await parser.parse(event.target.value))} />;
}
```

The hook exposes loading, ready, and error state. Keep the loader outside the component. React is a peer dependency of this package; core and training do not depend on React. See the [end-to-end guide](../../docs/end-to-end.md).
