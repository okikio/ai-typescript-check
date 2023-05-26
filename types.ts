import type { Typescript } from "./deps.ts";

export type CompilerOptions = Typescript.CompilerOptions;
export type { Typescript };

export type SandboxConfig = {
    /** The default source code for the playground */
    text: string
    /** @deprecated */
    useJavaScript?: boolean
    /** The default file for the playground  */
    filetype: "js" | "ts" | "d.ts"
    /** Compiler options which are automatically just forwarded on */
    compilerOptions: CompilerOptions
    /** Acquire types via type acquisition */
    acquireTypes: boolean
    /** Support twoslash compiler options */
    supportTwoslashCompilerOptions: boolean
    /** Get the text via query params and local storage, useful when the editor is the main experience */
    suppressAutomaticallyGettingDefaultText?: true
    /** Suppress setting compiler options from the compiler flags from query params */
    suppressAutomaticallyGettingCompilerFlags?: true
    /** Logging system */
    logger: {
      log: (...args: any[]) => void
      error: (...args: any[]) => void
      groupCollapsed: (...args: any[]) => void
      groupEnd: (...args: any[]) => void
    }
}