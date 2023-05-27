export { default as Typescript } from "https://esm.sh/typescript@5.0.4"

export * as ata from "https://esm.sh/@typescript/ata@0.9.3"
export * as lzstring from "https://esm.sh/@amoutonbrady/lz-string@0.1.0"
export * as path from "https://deno.land/std@0.189.0/path/mod.ts"

declare module "https://esm.sh/typescript@5.0.4" {
  // Hacking in some internal stuff
  type TypescriptOption = {
    name: string;
    type: "list" | "boolean" | "number" | "string" | Map<string, any>;
    element?: TypescriptOption;
  };

  export const optionDeclarations: Array<TypescriptOption>;
}
  