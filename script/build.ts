import { getDocs } from "./docs.tsx";
import { path } from "../deps.ts";
  
  // Destructure necessary path utilities from path (similar to path in Node.js)
const { dirname, fromFileUrl, join } = path;

// Get the directory of the current module file
// This is similar to __dirname in Node.js, but Deno uses URLs for modules, so we need to convert from a file URL to a path
const __dirname = dirname(fromFileUrl(import.meta.url));

const stream = (await getDocs())!;
await Deno.writeFile(join(__dirname, `../static/index.html`), stream);