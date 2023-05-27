import { twoslasher } from "./vendor/twoslash.ts";

const slash = twoslasher(`\
// @errors: 1003
/**
 * Gets the length of a string
 * @param value a string
 */
function fn(s: string) {
  console.log(s.substr(3))
}

export const slash = [] as string[]
fn("42")

console.
//      ^|
`, "ts")

console.log({
  slash: await slash
})