/** @jsx h */
import {
  ColorScheme,
  fromMarkdown,
  h,
  html,
  path,
  shiki,
  toHast,
  toHtml,
  unified,
  withHtmlInMarkdown,
  withShiki,
  GithubMarkdownFlavor,
} from "./deps.ts";

// Destructure necessary path utilities from path (similar to path in Node.js)
const { dirname, fromFileUrl, join } = path;

// Get the directory of the current module file
// This is similar to __dirname in Node.js, but Deno uses URLs for modules, so we need to convert from a file URL to a path
const __dirname = dirname(fromFileUrl(import.meta.url));

// check the color scheme with system settings automatically
html.use(ColorScheme("dark"));

export async function getDocs() {
  const highlighter = await shiki.getHighlighter({ theme: "github-dark" });
  const file = await unified()
    .use(fromMarkdown) // Parse markdown content to a syntax tree
    .use(GithubMarkdownFlavor)
    .use(withShiki, { highlighter })
    .use(toHast, { allowDangerousHtml: true })  // Turn markdown syntax tree to HTML syntax tree, ignoring embedded HTML
    .use(withHtmlInMarkdown)
    .use(toHtml)  // Serialize HTML syntax tree;
    .process(
      new TextDecoder().decode(
        await Deno.readFile(join(__dirname, "./README.md")),
      ),
    );

  return (
    await html({
      lang: "en",
      title: "Intro. - Typescript Code Analyzer API",
      meta: {
        description:
          "The REST API accepts a JSON & Form Data body with the following properties: code, extension, and options.",
      },
      links: [
        { rel: "mask-icon", href: "/favicon/favicon.svg", color: "#ffffff" },
        {
          rel: "stylesheet",
          href: "https://unpkg.com/sakura.css/css/normalize.css ",
          type: "text/css",
        },
        {
          rel: "stylesheet",
          href: "https://unpkg.com/sakura.css/css/sakura-vader.css ",
          type: "text/css",
        },
        {
          rel: "stylesheet",
          href: "./static/style.css",
          type: "text/css",
        },
      ],
      body: String(file),
    })
  ).body;
}
