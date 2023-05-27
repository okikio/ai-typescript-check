export { default as Typescript } from "https://esm.sh/typescript@5.0.4"

export * as ata from "https://esm.sh/@typescript/ata@0.9.3"
export * as lzstring from "https://esm.sh/@amoutonbrady/lz-string@0.1.0"
export * as path from "https://deno.land/std@0.189.0/path/mod.ts"

export { serve } from "https://deno.land/std@0.189.0/http/server.ts"
export { cors } from "https://deno.land/x/dewy@0.1.0/middlewares/cors.ts"
export * as media_types from "https://deno.land/std@0.189.0/media_types/mod.ts"
export * as dewy from "https://deno.land/x/dewy@0.1.0/mod.ts"

declare module "https://esm.sh/typescript@5.0.4" {
  // Hacking in some internal stuff
  type TypescriptOption = {
    name: string;
    type: "list" | "boolean" | "number" | "string" | Map<string, any>;
    element?: TypescriptOption;
  };

  export const optionDeclarations: Array<TypescriptOption>;
}
  