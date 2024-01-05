import { TwoSlashOptions, twoslasher } from "../vendor/twoslash.ts";
import { path } from "../deps.ts";

import { TwoSlashOptions as TwoSlashOptionsV2, twoslasher as twoslasherv2 } from "npm:@typescript/twoslash";

const { dirname, fromFileUrl, join } = path;
const __dirname = dirname(fromFileUrl(import.meta.url));


let value = `// @noErrors:    true  \nconsole.t \n//       ^| `

let opts: TwoSlashOptions = {}

const twoslash1 = await twoslasher(value, `ts`, opts)

console.log({
  twoslash1,
})

const twoslash2 = await twoslasherv2(value, `ts`, opts as TwoSlashOptionsV2)


console.log({
  twoslash2,
})