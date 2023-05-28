import { twoslasher } from "./vendor/twoslash.ts";


const slash = twoslasher(`\
// @module: esnext
// @target: ES2022
// @errors: 1003 2304 7006 2339
// @declaration: true
// @emit
// @filename: maths.ts 
/**
 * Gets the length of a string
 * @param value a string
 */
function fnx2(s: string) {
  console.log(s.substr(3))
}
export function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}

import {SpringEasing} from "spring-easing"
SpringEasing
// ^?

/**
 * Gets the length of a string
 * @param value a string
 */
function fnx(s: string) {
  console.log(s.substr(3))
//            ^^^^^^^^^^^ 
}

export const slash = [] as string[]
  fnx("42")
//^?
// ^^^^^^^ You need a description for highlight to work properly

function greet(person: string, date: Date) {
  console.log(\`Hello \${person}, today is \${date.toDateString()}!\`)
}

   greet("Maddison", new Date())
// ^^^^^ A Quick explanation  
console.g 
//       ^|

// @filename: index.ts 
import {absolute} from "./maths"
const value = absolute(-1)
//     ^?
//    ^^^^^^ Velue
const value2 = absolute(-2)
//     ^?
//    ^^^^^^ Value2

function fn(s) {
  console.log(s.substr(3))
}
`, "ts")

// console.log({
//   slash: await slash
// })

await Deno.writeFile("./vendor.json", new TextEncoder().encode(JSON.stringify(await slash, null, 2)))
