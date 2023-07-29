export { default as Typescript } from "https://esm.sh/typescript@5"

export * as lzstring from "https://esm.sh/@amoutonbrady/lz-string@0.1.0"
export * as path from "https://deno.land/std/path/mod.ts"

export * as oak from "https://deno.land/x/oak/mod.ts"
export { oakCors as cors } from "https://deno.land/x/cors/mod.ts"

export { parse } from "https://deno.land/std/yaml/parse.ts"

declare module "https://esm.sh/typescript@5" {
  // Hacking in some internal stuff
  type TypescriptOption = {
    name: string;
    type: "list" | "boolean" | "number" | "string" | Map<string, any>;
    element?: TypescriptOption;
  };

  export const optionDeclarations: Array<TypescriptOption>;
}
  