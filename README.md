# ai-typescript-check

[GitHub](https://github.com/okikio/ai-typescript-check#readme) <span style="padding-inline: 1rem">|</span> [Docs](https://ts-check.okikio.dev) <span style="padding-inline: 1rem">|</span> [License](https://github.com/okikio/ai-typescript-check#license)

`ai-typescript-check` is a ChatGPT plugin and API that provides linting, auto-completion, error checking, and type checking for TypeScript, JSX/TSX, and JavaScript files. It uses a modified version of [`@typescript/twoslash`](https://shikijs.github.io/twoslash/). Meaning all the typescript twoslash tips and tricks all work out of the box.

While primarily designed as a ChatGPT plugin for type checking TypeScript code, `ai-typescript-check` can also be used as a standalone API for type checking in any coding environment. We welcome your feedback and suggestions. You can check out the OpenAPI Spec to learn more about the API [.well-known/open-api.yaml](./.well-known/open-api.yaml) or using the website at [ts-check.okikio.dev/.well-known/openapi.yaml](https://ts-check.okikio.dev/.well-known/openapi.yaml)

## Install ChatGPT Plugin

### From Store:

1. Navigate to the official OpenAI plugin store.
2. Search for this plugin.
3. Click on the plugin to view its details.
4. Click on the "Install" button to add the plugin to your ChatGPT.

### Manually:

1. Navigate to the official OpenAI plugin store.
2. Click on the "Install an unverified plugin" link. 
3. Enter the official API URL `ts-check.okikio.dev` and click "Find Plugin".
4. ChatGPT will then walk you through the steps of installing the plugin, if it's not yet on the store.
5. Create a new chat using GPT-4 with Plugins.
6. Enable the "Typescript Code Analyzer API" plugin and start.

## Usage

#### Prompt

> 
> Type check transferables
> 
> ```ts
> import { hasTransferables } from "transferables" 
> ```

#### Response

> The TypeScript code:
> 
> ```ts
> import { hasTransferables } from "transferables"
> ```
> 
> imports a function named `hasTransferables` from a module named "transferables". The function `hasTransferables` takes up to three parameters:
> 
> 1. `obj: unknown` - The object to check for transferables.
> 2. `streams?: boolean` - An optional parameter that, if true, includes streams in the check for transferables.
> 3. `maxCount?: number` - An optional parameter that limits the number of iterations the function will perform when checking for transferables.
> 
> The function returns a boolean value indicating whether the input contains at least one transferable object, up to a maximum number of iterations.
> 
> Please note that the function `hasTransferables` is imported but not used in your code, which is why the TypeScript compiler is giving a warning.
> 
> Here is the type information for `hasTransferables`:
> 
> ```ts
> (alias) function hasTransferables(obj: unknown, streams?: boolean, maxCount?: number): boolean
> ```
> 
> And here is the documentation for the function:
> 
> ```ts
> Quickly checks to see if input contains at least one transferable object, up to a max number of iterations
> ```
> 
> You can see the code in the TypeScript playground [here](https://www.typescriptlang.org/play/#code/JYWwDg9gTgLgBAbzgCwIYGcAqVUDt0BmApjgEYA2R6cAvnAVBCHAEQw77FmXotA).

Here's this exmaple on ChatGPT: https://chat.openai.com/share/3b32d004-a1c3-4dfc-b862-5426518d31ef

### API

To utilize `ai-typescript-check`, please follow the steps below:

```ts
// Instantiate a new FormData object
const formData = new FormData();
formData.append("code", "import { hasTransferables } from \"transferables\"");
formData.append("extension", "ts");

// Initiate a POST request to the API
const res = await fetch("https://ts-check.okikio.dev/twoslash", {
  method: "POST",
  body: formData
})

// Output the response
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

// Initiate a GET request to the API
const res = await fetch(`https://ts-check.okikio.dev/twoslash?options=${options}`)

// Output the response
console.log({
  json: await res.json()
})
```

## Response

The API will return a JSON object containing the following information:

- `code`: The original code that was sent to the API.
- `extension`: The file extension of the code.
- `highlights`: An array of highlights from the code.
- `queries`: An array of queries from the code. This is particularly useful for understanding how the code interacts with the TypeScript system.
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

## API Reference

`ai-typescript-check` provides two main API endpoints: `POST /twoslash` and `GET /twoslash`. Both endpoints accept `TwoSlashOptions` as input and return `TwoSlashReturn` as output.

### POST `/twoslash`

This endpoint is designed for processing larger code inputs. It accepts `TwoSlashOptions` as JSON/FormData and returns `TwoSlashReturn` JSON. It supports ts, js, tsx, jsx.

#### Request Body

The request body should be a JSON object or FormData with the following properties:

- `code` (required): The TypeScript, JavaScript, TSX, or JSX code to run twoslash over.
- `extension` (required): The extension of the code file. Can be 'typescript', 'javascript', 'json', 'jsn', 'ts', 'js', 'tsx', or 'jsx'.
- `defaultOptions`: Default options for twoslash.
- `defaultCompilerOptions`: Default compiler options for TypeScript. This can include any valid tsconfig options as per the official [TypeScript documentation](https://www.typescriptlang.org/tsconfig).
- `fsMap`: A map of filenames to their content for the virtual file system.
- `customTags`: An array of custom tags.

#### Response

The response is a `TwoSlashReturn` JSON object with details about the code.

### GET `/twoslash`

This endpoint is designed for processing smaller amounts of code that are 254 characters in length or less. It accepts `TwoSlashOptions` as JSON/FormData and returns `TwoSlashReturn` JSON. It supports ts, js, tsx, jsx.

#### Query Parameters

The query parameters should include the `options` parameter with the same properties as the request body for the POST endpoint.

#### Response

The response is a `TwoSlashReturn` JSON object with details about the code.

## Error Handling

In the event of an error during the processing of your code, the API will return a `TwoslashError` JSON object with details about the error. This object includes the following properties:

- `error`: A string describing the error.
- `message`: A detailed message about the error.
- `errors`: An array of error codes.
- `compilerErrors`: A string with the compiler errors.

## License

`ai-typescript-check` is licensed under the [MIT License](https://github.com/okikio/ai-typescript-check/blob/main/LICENSE).
