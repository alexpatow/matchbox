# React integration

`useMatchbox` loads a parser and exposes initialization state. Use a stable loader outside the component. The generated TypeScript module needs no bundler plugin.

```tsx
"use client";

import { useState } from "react";
import { useMatchbox } from "@matchbox-ai/core/react";

const loadMoney = () => import("./.matchbox/money/model");

export function MoneyInput() {
  const { parse, status, error } = useMatchbox(loadMoney);
  const [message, setMessage] = useState("");

  return (
    <div>
      <button
        disabled={status !== "ready"}
        onClick={async () => {
          try {
            const result = await parse("twenty dollars");
            setMessage(
              result.status === "ok"
                ? `${result.value.amount} ${result.value.currency}`
                : result.reason,
            );
          } catch (cause) {
            setMessage(String(cause));
          }
        }}
      >
        Parse twenty dollars
      </button>
      <output aria-live="polite">{error ?? message}</output>
    </div>
  );
}
```

The path above assumes a component at the app root. Adjust it for your file's location. In Next.js, keep inference in a client component as shown. For direct artifact imports in Vite, see [the Vite plugin](reference/vite.md).

## useMatchbox contract

`useMatchbox<Output>(loader: () => Promise<{ default: MatchboxParser<Output> }>)` is exported from `@matchbox-ai/core/react`.

| Return field | Type                                               | Behavior                                        |
| ------------ | -------------------------------------------------- | ----------------------------------------------- |
| `status`     | `"loading"`, `"ready"`, or `"error"`.              | Reflects the current loader and initialization. |
| `error`      | `string` or `null`.                                | Loading error message.                          |
| `parse`      | `(input: string) => Promise<ParseResult<Output>>`. | Runs inference; call failures reject.           |

The hook calls optional `load` on mount. It does not store prediction results, debounce requests, catch parse errors, or dispose shared module instances. Applications own those behaviors. React 19 is the current peer requirement.

## Continuous input

For parsing while typing, keep the latest input in state and start a parse in an effect. Ignore results from an effect that has already cleaned up so an older prediction cannot overwrite a newer one. The hook's `status` describes model initialization, not an individual prediction.
