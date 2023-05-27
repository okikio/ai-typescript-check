import { lzstring } from "../deps.ts"

const decompressFromURL = "decompressFromEncodedURIComponent" in lzstring ? lzstring.decompressFromEncodedURIComponent as typeof lzstring.decompressFromURL : lzstring.decompressFromURL;

/**
 * Grabs the sourcecode for an example from the query hash or local storage
 * @param fallback if nothing is found return this
 * @param location DI'd copy of document.location
 */
export const getInitialCode = (fallback: string, location: URL | Location) => {
  // Old school support
  if (location.hash.startsWith("#src")) {
    const code = location.hash.replace("#src=", "").trim()
    return decodeURIComponent(code)
  }

  // New school support
  if (location.hash.startsWith("#code")) {
    const code = location.hash.replace("#code/", "").trim()
    let userCode = decompressFromURL(code)
    // Fallback incase there is an extra level of decoding:
    // https://gitter.im/Microsoft/TypeScript?at=5dc478ab9c39821509ff189a
    if (!userCode) userCode = decompressFromURL(decodeURIComponent(code))
    return userCode
  }

  return fallback
}