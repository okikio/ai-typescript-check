import type { CompilerOptions } from "../types.ts";
import { lzstring, Typescript } from "../deps.ts";

type System = Typescript.System;
type CustomTransformers = Typescript.CustomTransformers;
type LanguageServiceHost = Typescript.LanguageServiceHost;
type LanguageService = Typescript.LanguageService;
type CompilerHost = Typescript.CompilerHost;
type SourceFile = Typescript.SourceFile;
type TS = typeof Typescript;

// Open the default database for the script.
const kv = await Deno.openKv();

const shouldDebug = (Deno.env.get("DEBUG"));
const debugLog = shouldDebug
  ? console.log
  : (_message?: any, ..._optionalParams: any[]) => "";

export interface VirtualTypeScriptEnvironment {
  sys: System;
  languageService: LanguageService;
  getSourceFile: (fileName: string) => SourceFile | undefined;
  createFile: (fileName: string, content: string) => void;
  updateFile: (
    fileName: string,
    content: string,
    replaceTextSpan?: Typescript.TextSpan,
  ) => void;
}

/**
 * Makes a virtual copy of the TypeScript environment. This is the main API you want to be using with
 * @typescript/vfs. A lot of the other exposed functions are used by this function to get set up.
 *
 * @param sys an object which conforms to the TS Sys (a shim over read/write access to the fs)
 * @param rootFiles a list of files which are considered inside the project
 * @param ts a copy pf the TypeScript module
 * @param compilerOptions the options for this compiler run
 * @param customTransformers custom transformers for this compiler run
 */

export function createVirtualTypeScriptEnvironment(
  sys: System,
  rootFiles: string[],
  ts: TS,
  compilerOptions: CompilerOptions = {},
  customTransformers?: CustomTransformers,
): VirtualTypeScriptEnvironment {
  const mergedCompilerOpts = {
    ...defaultCompilerOptions(ts),
    ...compilerOptions,
  };

  const { languageServiceHost, updateFile } = createVirtualLanguageServiceHost(
    sys,
    rootFiles,
    mergedCompilerOpts,
    ts,
    customTransformers,
  );
  const languageService = ts.createLanguageService(languageServiceHost);
  const diagnostics = languageService.getCompilerOptionsDiagnostics();

  if (diagnostics.length) {
    const compilerHost = createVirtualCompilerHost(sys, compilerOptions, ts);
    throw new Error(
      ts.formatDiagnostics(diagnostics, compilerHost.compilerHost),
    );
  }

  return {
    // @ts-ignore
    name: "vfs",
    sys,
    languageService,
    getSourceFile: (fileName) =>
      languageService.getProgram()?.getSourceFile(fileName),

    createFile: (fileName, content) => {
      updateFile(
        ts.createSourceFile(
          fileName,
          content,
          mergedCompilerOpts.target!,
          false,
        ),
      );
    },
    updateFile: (fileName, content, optPrevTextSpan) => {
      const prevSourceFile = languageService.getProgram()!.getSourceFile(
        fileName,
      );
      if (!prevSourceFile) {
        throw new Error("Did not find a source file for " + fileName);
      }
      const prevFullContents = prevSourceFile.text;

      // TODO: Validate if the default text span has a fencepost error?
      const prevTextSpan = optPrevTextSpan ??
        ts.createTextSpan(0, prevFullContents.length);
      const newText = prevFullContents.slice(0, prevTextSpan.start) +
        content +
        prevFullContents.slice(prevTextSpan.start + prevTextSpan.length);
      const newSourceFile = ts.updateSourceFile(prevSourceFile, newText, {
        span: prevTextSpan,
        newLength: content.length,
      });

      updateFile(newSourceFile);
    },
  };
}

/**
 * Grab the list of lib files for a particular target, will return a bit more than necessary (by including
 * the dom) but that's OK
 *
 * @param target The compiler settings target baseline
 * @param ts A copy of the TypeScript module
 */
export const knownLibFilesForCompilerOptions = async (
  compilerOptions: CompilerOptions,
  ts: TS,
  fetcher = fetch,
  version = "latest",
) => {
  const target = compilerOptions.target || ts.ScriptTarget.ES2022;
  const lib = compilerOptions.lib || [];

  interface DirectoryOrFile {
    path: string;
    type: 'file' | 'directory';
    files?: DirectoryOrFile[];
    contentType?: string;
    integrity?: string;
    lastModified?: string;
    size?: number;
  }
  
  interface Root {
    path: string;
    type: 'file' | 'directory';
    files: DirectoryOrFile[];
  }

  const upToDateLibsList: string[] = [];
  try {
    const STORED_LIBS_PREFIX = [`ts-vfs`, version];
    const storedLibs = await kv.get<string[]>(STORED_LIBS_PREFIX);
    if (storedLibs.value) {
      (storedLibs.value).forEach(lib => {
        upToDateLibsList.push(lib)
      });
    } else {
      const res = await fetcher(`https://unpkg.com/typescript@${version}/lib/?meta`)
      const json: Root = await res.json();
      json.files.forEach((file) => {
        const name = file.path.replace(/^\/lib\//, '');
        if (file.type === 'file' && /^lib\.?(.*)?\.d\.ts$/.test(name)) {
          upToDateLibsList.push(name);
        }
      })
      if (upToDateLibsList.length > 0) {
        try {
          await kv.set(STORED_LIBS_PREFIX, upToDateLibsList);
        } catch (_e) { /* empty */ }
      }
    }
  } catch (error) {
    console.log(error);
  }

  const files = Array.from(new Set([
    // JavaScript only
    "lib.es5.d.ts",
    "lib.es2015.d.ts",
    "lib.es2016.d.ts",
    "lib.es2017.d.ts",
    "lib.es2018.d.ts",
    "lib.es2019.d.ts",
    "lib.es2020.d.ts",
    "lib.es2021.d.ts",
    "lib.es2022.d.ts",
    "lib.es2023.d.ts",
    "lib.esnext.d.ts",
    // Host only
    "lib.dom.d.ts",
    "lib.dom.iterable.d.ts",
    "lib.webworker.d.ts",
    "lib.webworker.importscripts.d.ts",
    "lib.webworker.iterable.d.ts",
    "lib.scripthost.d.ts",
    // By-feature options
    "lib.es2015.core.d.ts",
    "lib.es2015.collection.d.ts",
    "lib.es2015.generator.d.ts",
    "lib.es2015.iterable.d.ts",
    "lib.es2015.promise.d.ts",
    "lib.es2015.proxy.d.ts",
    "lib.es2015.reflect.d.ts",
    "lib.es2015.symbol.d.ts",
    "lib.es2015.symbol.wellknown.d.ts",
    "lib.es2016.array.include.d.ts",
    "lib.es2017.date.d.ts",
    "lib.es2017.object.d.ts",
    "lib.es2017.sharedmemory.d.ts",
    "lib.es2017.string.d.ts",
    "lib.es2017.intl.d.ts",
    "lib.es2017.typedarrays.d.ts",
    "lib.es2018.asyncgenerator.d.ts",
    "lib.es2018.asynciterable.d.ts",
    "lib.es2018.regexp.d.ts",
    "lib.es2018.promise.d.ts",
    "lib.es2018.intl.d.ts",
    "lib.es2019.array.d.ts",
    "lib.es2019.object.d.ts",
    "lib.es2019.string.d.ts",
    "lib.es2019.symbol.d.ts",
    "lib.es2019.intl.d.ts",
    "lib.es2020.bigint.d.ts",
    "lib.es2020.date.d.ts",
    "lib.es2020.promise.d.ts",
    "lib.es2020.sharedmemory.d.ts",
    "lib.es2020.string.d.ts",
    "lib.es2020.symbol.wellknown.d.ts",
    "lib.es2020.intl.d.ts",
    "lib.es2020.number.d.ts",
    "lib.es2021.string.d.ts",
    "lib.es2021.promise.d.ts",
    "lib.es2021.weakref.d.ts",
    "lib.es2021.intl.d.ts",
    "lib.es2022.array.d.ts",
    "lib.es2022.error.d.ts",
    "lib.es2022.intl.d.ts",
    "lib.es2022.object.d.ts",
    "lib.es2022.sharedmemory.d.ts",
    "lib.es2022.string.d.ts",
    "lib.es2022.regexp.d.ts",
    "lib.es2023.array.d.ts",
    "lib.esnext.intl.d.ts",
    "lib.decorators.d.ts",
    "lib.decorators.legacy.d.ts",
    // Default libraries
    "lib.d.ts",
    "lib.es6.d.ts",
    "lib.es2016.full.d.ts",
    "lib.es2017.full.d.ts",
    "lib.es2018.full.d.ts",
    "lib.es2019.full.d.ts",
    "lib.es2020.full.d.ts",
    "lib.es2021.full.d.ts",
    "lib.es2022.full.d.ts",
    "lib.es2023.full.d.ts",
    "lib.esnext.full.d.ts",
    ...upToDateLibsList,
  ]));

  // @ts-ignore: This is getting annoying
  const targetToCut: string = ts.ScriptTarget[typeof target === "string" ? Typescript.ScriptTarget[target.toUpperCase()] : target].toString().toLowerCase();
  const matches = files.filter((f) =>
    f.startsWith(`lib.${targetToCut}`)
  );
  const targetCutIndex = files.indexOf(matches.pop()!);

  const getMax = (array: number[]) =>
    array && array.length
      ? Math.max(...array)
      : undefined;

  // Find the index for everything in
  const indexesForCutting = lib.map((lib) => {
    const matches = files.filter((f) =>
      f.startsWith(`lib.${lib.toLowerCase()}`)
    );
    if (matches.length === 0) return 0;

    const cutIndex = files.indexOf(matches.pop()!);
    return cutIndex;
  });

  const libCutIndex = getMax(indexesForCutting) || 0;

  const finalCutIndex = Math.max(targetCutIndex, libCutIndex);
  return files.slice(0, finalCutIndex + 1);
};

/**
 * Create a virtual FS Map with the lib files from a particular TypeScript
 * version based on the target, Always includes dom ATM.
 *
 * @param options The compiler target, which dictates the libs to set up
 * @param version the versions of TypeScript which are supported
 * @param cache should the values be stored in local storage
 * @param ts a copy of the typescript import
 * @param lzString an optional copy of the lz-string import
 * @param fetcher an optional replacement for the global fetch function (tests mainly)
 */
export const createDefaultMapFromCDN = async (
  options: CompilerOptions,
  version: string,
  cache: boolean,
  ts: TS,
  lzString?: typeof lzstring,
  fetcher?: typeof fetch,
) => {
  const fetchlike = fetcher || fetch;
  const fsMap = new Map<string, string>();
  const files = await knownLibFilesForCompilerOptions(options, ts, fetchlike, version);
  const prefix =
    `https://typescript.azureedge.net/cdn/${version}/typescript/lib/`;

  function zip(str: string) {
    if (lzString) {
      const compress = "compressToUTF16" in lzString
        ? lzString.compressToUTF16 as typeof lzString.compressToBase64
        : lzString.compressToBase64;
      return compress(str);
    }

    return str;
  }

  function unzip(str: string) {
    if (lzString) {
      const decompress = "decompressFromUTF16" in lzString
        ? lzString.decompressFromUTF16 as typeof lzString.decompressFromBase64
        : lzString.decompressFromBase64;

      return decompress(str);
    }

    return str;
  }

  // Map the known libs to a node fetch promise, then return the contents
  function uncached() {
    return Promise.all(
      files.map((lib) => fetchlike(prefix + lib).then((resp) => resp.text())),
    ).then((contents) => {
      contents.forEach((text, index) => fsMap.set("/" + files[index], text));
    });
  }

  // A localstorage and lzzip aware version of the lib files
  async function cached() {
    const keysToDelete: Deno.KvKey[] = [];
    // List out all entries with keys starting with `["ts-lib"]`
    for await (const entry of kv.list({ prefix: ["ts-lib"] })) {
      // Remove anything which isn't from this version
      if (!entry.key.includes(version)) {
        keysToDelete.push(entry.key)
      }
    }

    await Promise.all(keysToDelete.map((key) => kv.delete(key)));
    const contents = await Promise.all(
      files.map(async (lib) => {
        const cacheKey = ["ts-lib", version, lib];
        const content = await kv.get<string>(cacheKey);

        if (!content.value || content.value === "null") {
          // Make the API call and store the text concent in the cache
          const resp = await fetchlike(prefix + lib);
          const t = await resp.text();
          try {
            await kv.set(cacheKey, zip(t));
          } catch (_e) { /* empty */ }
          return t;
        } else {
          return Promise.resolve(unzip(content.value));
        }
      }),
    );
    contents.forEach((text, index) => {
      const name = "/" + files[index];
      fsMap.set(name, text!);
    });
  }

  const func = cache ? cached : uncached;
  await func();
  return fsMap;
};

function notImplemented(methodName: string): any {
  throw new Error(`Method '${methodName}' is not implemented.`);
}

function audit<ArgsT extends any[], ReturnT>(
  name: string,
  fn: (...args: ArgsT) => ReturnT,
): (...args: ArgsT) => ReturnT {
  return (...args) => {
    const res = fn(...args);

    const smallres = typeof res === "string" ? res.slice(0, 80) + "..." : res;
    debugLog("> " + name, ...args);
    debugLog("< " + smallres);

    return res;
  };
}

/** The default compiler options if TypeScript could ever change the compiler options */
const defaultCompilerOptions = (ts: typeof Typescript): CompilerOptions => {
  return {
    ...ts.getDefaultCompilerOptions(),
    jsx: ts.JsxEmit.React,
    strict: true,
    esModuleInterop: true,
    module: ts.ModuleKind.ESNext,
    suppressOutputPathCheck: true,
    skipLibCheck: true,
    skipDefaultLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  };
};

// "/DOM.d.ts" => "/lib.dom.d.ts"
const libize = (path: string) => path.replace("/", "/lib.").toLowerCase();

/**
 * Creates an in-memory System object which can be used in a TypeScript program, this
 * is what provides read/write aspects of the virtual fs
 */
export function createSystem(files: Map<string, string>): System {
  return {
    args: [],
    createDirectory: () => notImplemented("createDirectory"),
    // TODO: could make a real file tree
    directoryExists: audit("directoryExists", (directory) => {
      return Array.from(files.keys()).some((path) =>
        path.startsWith(directory)
      );
    }),
    exit: () => notImplemented("exit"),
    fileExists: audit(
      "fileExists",
      (fileName) => files.has(fileName) || files.has(libize(fileName)),
    ),
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    getExecutingFilePath: () => notImplemented("getExecutingFilePath"),
    readDirectory: audit(
      "readDirectory",
      (directory) => (directory === "/" ? Array.from(files.keys()) : []),
    ),
    readFile: audit(
      "readFile",
      (fileName) => files.get(fileName) || files.get(libize(fileName)),
    ),
    resolvePath: (path) => path,
    newLine: "\n",
    useCaseSensitiveFileNames: true,
    write: () => notImplemented("write"),
    writeFile: (fileName, contents) => {
      files.set(fileName, contents);
    },
  };
}

/**
 * Creates an in-memory CompilerHost -which is essentially an extra wrapper to System
 * which works with TypeScript objects - returns both a compiler host, and a way to add new SourceFile
 * instances to the in-memory file system.
 */
export function createVirtualCompilerHost(
  sys: System,
  compilerOptions: CompilerOptions,
  ts: TS,
) {
  const sourceFiles = new Map<string, SourceFile>();
  const save = (sourceFile: SourceFile) => {
    sourceFiles.set(sourceFile.fileName, sourceFile);
    return sourceFile;
  };

  type Return = {
    compilerHost: CompilerHost;
    updateFile: (sourceFile: SourceFile) => boolean;
  };

  const vHost: Return = {
    compilerHost: {
      ...sys,
      getCanonicalFileName: (fileName) => fileName,
      getDefaultLibFileName: () =>
        "/" + ts.getDefaultLibFileName(compilerOptions), // '/lib.d.ts',
      // getDefaultLibLocation: () => '/',
      getDirectories: () => [],
      getNewLine: () => sys.newLine,
      getSourceFile: (fileName) => {
        return (
          sourceFiles.get(fileName) ||
          save(
            ts.createSourceFile(
              fileName,
              sys.readFile(fileName)!,
              compilerOptions.target || defaultCompilerOptions(ts).target!,
              false,
            ),
          )
        );
      },
      useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames,
    },
    updateFile: (sourceFile) => {
      const alreadyExists = sourceFiles.has(sourceFile.fileName);
      sys.writeFile(sourceFile.fileName, sourceFile.text);
      sourceFiles.set(sourceFile.fileName, sourceFile);
      return alreadyExists;
    },
  };
  return vHost;
}

/**
 * Creates an object which can host a language service against the virtual file-system
 */
export function createVirtualLanguageServiceHost(
  sys: System,
  rootFiles: string[],
  compilerOptions: CompilerOptions,
  ts: TS,
  customTransformers?: CustomTransformers,
) {
  const fileNames = [...rootFiles];
  const { compilerHost, updateFile } = createVirtualCompilerHost(
    sys,
    compilerOptions,
    ts,
  );
  const fileVersions = new Map<string, string>();
  let projectVersion = 0;
  const languageServiceHost: LanguageServiceHost = {
    ...compilerHost,
    getProjectVersion: () => projectVersion.toString(),
    getCompilationSettings: () => compilerOptions,
    getCustomTransformers: () => customTransformers,
    // A couple weeks of 4.8 TypeScript nightlies had a bug where the Program's
    // list of files was just a reference to the array returned by this host method,
    // which means mutations by the host that ought to result in a new Program being
    // created were not detected, since the old list of files and the new list of files
    // were in fact a reference to the same underlying array. That was fixed in
    // https://github.com/microsoft/TypeScript/pull/49813, but since the twoslash runner
    // is used in bisecting for changes, it needs to guard against being busted in that
    // couple-week period, so we defensively make a slice here.
    getScriptFileNames: () => fileNames.slice(),
    getScriptSnapshot: (fileName) => {
      const contents = sys.readFile(fileName);
      if (contents) {
        return ts.ScriptSnapshot.fromString(contents);
      }
      return;
    },
    getScriptVersion: (fileName) => {
      return fileVersions.get(fileName) || "0";
    },
    writeFile: sys.writeFile,
  };

  type Return = {
    languageServiceHost: LanguageServiceHost;
    updateFile: (sourceFile: Typescript.SourceFile) => void;
  };

  const lsHost: Return = {
    languageServiceHost,
    updateFile: (sourceFile) => {
      projectVersion++;
      fileVersions.set(sourceFile.fileName, projectVersion.toString());
      if (!fileNames.includes(sourceFile.fileName)) {
        fileNames.push(sourceFile.fileName);
      }
      updateFile(sourceFile);
    },
  };
  return lsHost;
}
