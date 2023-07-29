// @deno-types=https://unpkg.com/typescript@latest/lib/typescript.d.ts
export { default as Typescript } from "https://esm.sh/typescript@latest"

export * as lzstring from "https://esm.sh/@amoutonbrady/lz-string"
export * as path from "https://deno.land/std/path/mod.ts"

export * as oak from "https://deno.land/x/oak/mod.ts"
export { oakCors as cors } from "https://deno.land/x/cors/mod.ts"

export { parse } from "https://deno.land/std/yaml/parse.ts"

export {unified} from 'https://esm.sh/unified'
export { default as remarkParse } from 'https://esm.sh/remark-parse'
export { default as remarkRehype } from 'https://esm.sh/remark-rehype'
export { default as rehypeStringify } from 'https://esm.sh/rehype-stringify'

export { default as html, h, Fragment } from "https://deno.land/x/htm/mod.ts"
export { default as ColorScheme } from "https://deno.land/x/htm/plugins/color-scheme.ts"

declare module "https://esm.sh/typescript@latest" {
  // Hacking in some internal stuff
  type TypescriptOption = {
    name: string;
    type: "list" | "boolean" | "number" | "string" | Map<string, any>;
    element?: TypescriptOption;
  };

  export const optionDeclarations: Array<TypescriptOption>;
}
  