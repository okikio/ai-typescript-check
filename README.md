# ai-typescript-check

`ai-typescript-check` is a ChatGPT plugin and API that provides linting, auto-completion, error checking, and type checking for TypeScript, JSX/TSX, and JavaScript files. It uses a modified version of [`@typescript/twoslash`](https://shikijs.github.io/twoslash/).

While primarily designed as a ChatGPT plugin for type checking TypeScript code, `ai-typescript-check` can also be used as a standalone API for type checking in any coding environment. We welcome your feedback and suggestions. You can check out the OpenAPI Spec to learn more about the API [.well-known/open-api.yaml](./.well-known/open-api.yaml) or using the website at [ts-check.okikio.dev/.well-known/openapi.yaml](https://ts-check.okikio.dev/.well-known/openapi.yaml)

## Example Usage in Deno

You can use `ai-typescript-check` in Deno by sending a POST request to the API endpoint. Here's an example:

```ts
// Create a new FormData instance
const formData = new FormData();
formData.append("code", "import { hasTransferables } from \"transferables\"");
formData.append("extension", "ts");

// Send a POST request to the API
const res = await fetch("https://ts-check.okikio.dev/twoslash", {
  method: "POST",
  body: formData
})

// Log the response
console.log({
  json: await res.json()
})
```

Alternatively, you can pass the options as a query parameter:

```ts
// Define the options
const options = JSON.stringify({
  "code": `import { hasTransferables } from "transferables"`,
  "extension": "ts"
});

// Send a GET request to the API
const res = await fetch(`https://ts-check.okikio.dev/twoslash?options=${options}`)

// Log the response
console.log({
  json: await res.json()
})
```

## Response Format

The API returns a JSON object with the following properties:

- `code`: The original code that was sent to the API.
- `extension`: The file extension of the code.
- `highlights`: An array of highlights from the code.
- `queries`: An array of queries from the code.
- `staticQuickInfos`: An array of quick info objects, each containing details about a specific part of the code.
- `errors`: An array of errors found in the code.
- `warnings`: An array of warnings about the code.
- `playgroundURL`: A URL to the TypeScript playground with the code pre-loaded.
- `tags`: An array of tags associated with the code.

Here's an example response:

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
