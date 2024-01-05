import { twoslasher } from "../vendor/twoslash.ts";
import { path } from "../deps.ts";

import { twoslasher as twoslasherv2 } from "npm:@typescript/twoslash/dist/twoslash.cjs.development.js";

const { dirname, fromFileUrl, join } = path;
const __dirname = dirname(fromFileUrl(import.meta.url));


const twoslash1 = await twoslasher(`\
// @noErrors
console.t
      // ^| Col 
`, `ts`, {
})

const twoslash2 = await twoslasherv2(`\
// @noErrors
console.t
//       ^|
`, `ts`, {
})

console.log({
  twoslash1,
  twoslash2,
})