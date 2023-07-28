# ai-typescript-check

Lint, auto-complete, error check, and type check typescript, jsx/tsx, and javascript files using an API.
Uses a partially modified version of [`@typescript/twoslash`](https://shikijs.github.io/twoslash/).

Example usage in Deno

```ts
const formData = new FormData();
formData.append("code", "import { hasTransferables } from \"transferables\"")
formData.append("extension", "ts");

const res = await fetch("https://ts-check.okikio.dev/twoslash", {
  method: "POST",
  body: formData
})

console.log({
  json: await res.json()
})

// OR

const options = JSON.stringify({
  "code": `import { hasTransferables } from "transferables"`,
  "extension": "ts"
});

// 
const res = await fetch(`https://ts-check.okikio.dev/twoslash?options=${options}`)

console.log({
  json: await res.json()
})
```

Results

```json
{
  "code": "import { hasTransferables } from \"transferables\"",
  "extension": "ts",
  "highlights": [],
  "queries": [],
  "staticQuickInfos": [
    {
      "text": "(alias) function hasTransferables(obj: unknown, streams?: boolean, maxCount?: number): boolean\nimport hasTransferables",
      "docs": "Quickly checks to see if input contains at least one transferable object, up to a max number of iterations\nThanks @aaorris for the help optimizing perf.",
      "start": 9,
      "length": 16,
      "line": 0,
      "character": 9,
      "targetString": "hasTransferables"
    }
  ],
  "errors": [],
  "warnings": [
    {
      "category": 2,
      "code": 6133,
      "length": 48,
      "line": 0,
      "character": 0,
      "renderedMessage": "'hasTransferables' is declared but its value is never read.",
      "id": "warn-6133-0-48"
    }
  ],
  "playgroundURL": "https://www.typescriptlang.org/play/#code/JYWwDg9gTgLgBAbzgCwIYGcAqVUDt0BmApjgEYA2R6cAvnAVBCHAEQw77FmXotA",
  "tags": []
}
```
