/** @jsx h */
import {
  path,
  rehypeStringify,
  remarkParse,
  remarkRehype,
  unified,
  html,
  h,
  ColorScheme
} from "./deps.ts";

// Destructure necessary path utilities from path (similar to path in Node.js)
const { dirname, fromFileUrl, join } = path;

// Get the directory of the current module file
// This is similar to __dirname in Node.js, but Deno uses URLs for modules, so we need to convert from a file URL to a path
const __dirname = dirname(fromFileUrl(import.meta.url));


// check the color scheme with system settings automatically
html.use(ColorScheme("auto"));

export async function toHTML() {
  const file = await unified()
    .use(remarkParse) // Parse markdown content to a syntax tree
    .use(remarkRehype) // Turn markdown syntax tree to HTML syntax tree, ignoring embedded HTML
    .use(rehypeStringify) // Serialize HTML syntax tree
    .process(
      new TextDecoder().decode(await Deno.readFile(join(__dirname, "./README.md")))
    );

  // {
  //   hey: "Hello World! The API is working!",
  //   message:
  //     "/twoslash - Accepts a JSON & Form Data body with the following properties: code, extension, and options.",
  // };

  return (
    await html({
      lang: "en",
      title: "Intro. - Typescript Code Analyzer API",
      meta: {
        description: "The REST API accepts a JSON & Form Data body with the following properties: code, extension, and options.",
      },
      links: [
        { rel: "mask-icon", href: "/favicon/favicon.svg", color: "#ffffff" },
        { rel: "stylesheet", href: "https://unpkg.com/sakura.css/css/sakura-vader.css", type: "text/css" },
      ],
      body: String(file),
    })
  ).body;
}