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

## Recurrent models and partial results

The hook preserves the generated recurrent parser's overloads. Keep the loader's inferred type; annotating it as a generic `MatchboxParser` hides the additional options from TypeScript.

```tsx
import { useMatchbox } from "@matchbox-ai/core/react";

const loadLexer = () => import("./.matchbox/lexer/model");

// Inside your component:
const lexer = useMatchbox(loadLexer);
async function highlight(source: string) {
  const result = await lexer.parse(source, { allowPartial: true, gpu: true });

  if (result.status === "partial") {
    // Render result.value as a candidate and mark result.uncertainRanges.
  } else if (result.status === "ok") {
    // Every supervised part passed the threshold and the schema validated.
  } else {
    // result.value is null; retain the original text or show result.reason.
  }
}
```

Omit `gpu` for CPU inference. Omit `allowPartial` for whole-result acceptance. Partial candidates include uncertain predictions; above-threshold predictions can also be wrong. Ranges describe UTF-16 source offsets, not arbitrary output fields. The full [runtime contract](reference/runtime.md#partialmatchboxparser) describes the result union.

The hook's mount-time `load()` initializes CPU even when later calls request GPU. GPU initializes on its first requested parse. For an exclusively GPU application that must avoid downloading CPU, import the generated parser directly and call `parse(source, { gpu: true })` without `load()`. Handle loading, cancellation and errors in the component. A GPU failure rejects the call; it is not a model uncertainty result.
