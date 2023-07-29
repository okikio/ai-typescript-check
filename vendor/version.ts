export async function getTypescriptVersions() {
  const response = await fetch(
    "https://typescript.azureedge.net/indexes/releases.json",
  );
  const releases: { versions: string[] } = await response.json();
  const versions = releases.versions.reverse();

  // Look through the prereleases to see if the beta and RC are included in the pre-releases
  // and add those to the list of versions.
  const preReleaseResponse = await fetch(
    "https://typescript.azureedge.net/indexes/pre-releases.json",
  );
  const preReleases = await preReleaseResponse.json();
  const latestStable = versions[0];

  // e.g. 4.3.1 -> 4.4.0-beta
  // this won't work for 5.0 specifically, but that's an ok edge case for me
  const possibleBeta = `${latestStable.split(".")[0]}.${
    Number(latestStable.split(".")[1]) + 1
  }.0-beta`;
  const addBeta = preReleases.versions.includes(possibleBeta);

  const possibleRc = `${latestStable.split(".")[0]}.${
    Number(latestStable.split(".")[1]) + 1
  }.1-rc`;
  const addRc = preReleases.versions.includes(possibleRc);

  // Get the highest maj/min ignoring patch versions
  const latestMajMin = new Map();
  versions.forEach((v) => {
    const majMin = v.split(".")[0] + "." + v.split(".")[1];
    if (!latestMajMin.has(majMin)) {
      latestMajMin.set(majMin, v);
    }
  });

  // prettier-ignore
  // Adds RC and Beta to the versions automatically
  const supportedVersions = [
    addRc ? possibleRc : "",
    addBeta ? possibleBeta : "",
    ...latestMajMin.values(),
  ].filter(Boolean);

  /**
   * The versions of monaco-typescript which we can use
   * for backwards compatibility with older versions
   * of TS in the playground.
   */
  const supportedReleases = [...supportedVersions, "Latest"];

  /** Returns the latest TypeScript version supported by the sandbox */
  const latestSupportedTypeScriptVersion: string = supportedReleases
    .filter((key) => key !== "Nightly" && !key.includes("-"))
    .sort()
    .pop()!;

  return {
    /** Every prod version **/
    versions,
    /** The latest major.min version **/
    supportedReleases,
    releases,
    possibleBeta,
    possibleRc,
    latestSupportedTypeScriptVersion,
  };
}
