import { Typescript } from "./deps.ts"

/**
 * Determines whether escape sequences in a token of a specific kind should be preserved.
 * Useful for maintaining the integrity of literals where escape characters are meaningful.
 *
 * @example
 * // Simple: In string literals like `"Hello\nWorld"`, the `\n` should be preserved.
 * shouldPreserveEscapes(ts.SyntaxKind.StringLiteral);
 * 
 * @example
 * // Complex: In JSX text, escape sequences are part of the content and should not be altered.
 * shouldPreserveEscapes(ts.SyntaxKind.JsxText);
 *
 * @param kind - The kind of the token being analyzed.
 * @returns True if escape sequences should be preserved; otherwise, false.
 */
export function shouldPreserveEscapes(kind: Typescript.SyntaxKind, ts = Typescript): boolean {
  return [
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.JsxText,
    ts.SyntaxKind.JsxTextAllWhiteSpaces,
    ts.SyntaxKind.RegularExpressionLiteral,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.TemplateHead,
    ts.SyntaxKind.TemplateMiddle,
    ts.SyntaxKind.TemplateTail,
    // Additional kinds can be added as needed.
  ].includes(kind);
}

/**
 * Processes the text of a token, applying or preserving escape sequences based on the token kind.
 * This function handles different contexts like strings, regexes, and templates.
 *
 * @example
 * // Simple: Convert escape sequences in a regular code line.
 * processToken('console.log("Line1\\nLine2");', ts.SyntaxKind.StringLiteral);
 *
 * @example
 * // Advanced: Leave a regex pattern unchanged.
 * processToken('/\\d+/', ts.SyntaxKind.RegularExpressionLiteral);
 *
 * @param text - The text of the token.
 * @param kind - The kind of the token.
 * @returns The processed text.
 */
export function processToken(text: string, kind: Typescript.SyntaxKind, ts = Typescript): string {
  if (shouldPreserveEscapes(kind, ts)) {
    // Special handling for regex literals to preserve their pattern.
    if (kind === ts.SyntaxKind.RegularExpressionLiteral) {
      return processRegex(text);
    }
    return text;
  }

  // Unescape common escape sequences for other kinds of tokens.
  return unescapeSequences(text);
}

/**
 * Replaces escape sequences in a given text with their corresponding characters.
 * This function is commonly used for non-literal parts of the code.
 *
 * @example
 * // Simple: Replace basic escape sequences.
 * unescapeSequences("Line1\\nLine2");
 *
 * @example
 * // Complex: Handle Unicode escapes.
 * unescapeSequences("\\u0041\\u0042\\u0043");
 *
 * @param text - The text to be processed.
 * @returns The text with escape sequences replaced.
 */
export function unescapeSequences(text: string): string {
  const result = text
    .replace(/\\f/g, '\f')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\v/g, '\v')
    .replace(/\\0/g, '\0')
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u{([0-9A-Fa-f]{1,6})}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  console.log({ text, result, test: /\n/g.test(text) })
  return result
}

/**
 * Processes regex literals, ensuring that escape sequences are handled correctly.
 * This function is designed to preserve the pattern of the regex.
 *
 * @example
 * // Simple: Keep a basic regex pattern unchanged.
 * processRegex('/\\d+/');
 *
 * @example
 * // Advanced: Complex regex patterns remain intact.
 * processRegex('/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/');
 *
 * @param regex - The regex literal text.
 * @returns The processed regex.
 */
export function processRegex(regex: string): string {
  // Add any specific processing for regex literals if necessary.
  // For now, it returns the regex as-is.
  return regex;
}

/**
 * Processes TypeScript source code to handle escape sequences.
 * It scans the code, processes each token, and reconstructs the code with escape sequences handled.
 *
 * @example
 * // Simple: Process a single line of code.
 * processCode('let example = "Line1\\nLine2";');
 *
 * @example
 * // Complex: Process a block of code with various contexts.
 * processCode(`function greet() { console.log("Hello\\nWorld"); } /\\d+/.test("123");`);
 *
 * @param code - The TypeScript source code.
 * @returns The processed code.
 */
export function processCode(code: string, ts = Typescript): string {
  let output = '';
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    code
  );

  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const text = scanner.getTokenText();
    output += processToken(text, token);
    token = scanner.scan();
  }

  return output;
}