
import { Typescript } from "../deps.ts"
import type { CompilerOptions } from "../types.ts"

import * as tsvfs from "../vendor/ts-vfs.ts";

const {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} = tsvfs;

const compilerOpts: CompilerOptions = {
  target: Typescript.ScriptTarget.ES2022,
  module: Typescript.ModuleKind.ES2022,
  "lib": [
    "es2022",
    "dom",
    "webworker",
  ],
  "esModuleInterop": true,
};
const ENTRY_POINT = "index.ts";
const FS_Map = await createDefaultMapFromCDN(
  compilerOpts,
  Typescript.version,
  false,
  Typescript,
);

export function createTypescriptLanguageService(initialText = "const hello = 'hi'", fsMap = FS_Map) {
  fsMap.set(ENTRY_POINT, initialText);

  const system = createSystem(fsMap);
  const env = createVirtualTypeScriptEnvironment(
    system,
    [ENTRY_POINT],
    Typescript,
    compilerOpts,
  );

  return {
    fsMap,
    system,
    env,
    version: Typescript.version,
  }
}

export function createAutoComplete(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT, pos: number, options?: Typescript.GetCompletionsAtPositionOptions, formattingSettings?: Typescript.FormatCodeSettings | Typescript.FormatCodeOptions, preferences?: Typescript.UserPreferences) {
  const result = env.languageService.getCompletionsAtPosition(
    path,
    pos,
    options,
    formattingSettings
  );

  const details = result?.entries.map(x => {
    return Object.assign({}, x, {
      details: env.languageService.getCompletionEntryDetails(path, pos, x.name, formattingSettings, x.source, preferences, x.data) 
    })
  });

  return Object.assign({}, result, { entries: details })
}

export function createTooltip(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT, pos: number) {
  const result = env.languageService.getQuickInfoAtPosition(path, pos);
  return result ? 
    {
      result,
      tootltipText: Typescript.displayPartsToString(result.displayParts) +
        (result.documentation?.length
          ? "\n" + Typescript.displayPartsToString(result.documentation)
          : ""),
    } : 
    { result, tooltipText: "" }
}

export function createLint(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT, formatOptions: Typescript.FormatCodeSettings = {}, preferences: Typescript.UserPreferences = {}) {
  const SyntacticDiagnostics = env.languageService.getSyntacticDiagnostics(path);
  const SemanticDiagnostic = env.languageService.getSemanticDiagnostics(path);
  const SuggestionDiagnostics = env.languageService.getSuggestionDiagnostics(path);

  const result = [
    ...SyntacticDiagnostics,
    ...SemanticDiagnostic,
    ...SuggestionDiagnostics,
  ];

  return result
    .map((v) => {
      if (
        typeof v.start !== "number" || 
        typeof v.length !== "number"
      ) return null;

      const from = v.start;
      const to = from + v.length;
      const codeActions = env.languageService.getCodeFixesAtPosition(path, from, to, [v.category], formatOptions, preferences);

      const diag = {
        from,
        to,
        message: v.messageText,
        source: v?.source,
        severity: [
          "warning",
          "error",
          "info",
          "info",
        ][v.category],
        actions: codeActions
      };

      return diag;
    })
    .filter(x => x)
}

export function createReferences(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT) {
  const result = env.languageService.getFileReferences(path);
  return result
}

export function createFindReferences(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT, pos: number) {
  const result = env.languageService.findReferences(path, pos);
  return result?.map(x => {
    return Object.assign({}, x, {
      definitionText: Typescript.displayPartsToString(x.definition.displayParts)
    })
  })
}

export function createOrganizeImports(env: tsvfs.VirtualTypeScriptEnvironment, args: Typescript.OrganizeImportsArgs, formatOptions: Typescript.FormatCodeSettings = {}, preferences: Typescript.UserPreferences = {}) {
  const result = env.languageService.organizeImports(args, formatOptions, preferences);
  return result
}

export function updateFile(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT, value = "const hello = 'hi'") {
  return env.updateFile(path, value);
}

export function createFile(env: tsvfs.VirtualTypeScriptEnvironment, path = ENTRY_POINT, value = "const hello = 'hi'") {
  return env.createFile(path, value);
}