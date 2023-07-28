import { cors, dewy, media_types, path, serve } from "./deps.ts";
import { twoslasher } from "./vendor/twoslash.ts";
import type { TwoSlashOptions } from "./vendor/twoslash.ts";

const { extname, basename, dirname, fromFileUrl, join } = path;
const { Router } = dewy;
const { contentType } = media_types;

const __dirname = dirname(fromFileUrl(import.meta.url));

interface TwoslashRequestOptions extends TwoSlashOptions {
  code: string;
  extension: string;
}

const router = new Router();
// router.use(cors());
router.get("/", () => {
  try {
    return Response.json({
      hey: "Hello World! The API is working!",
      message:
        "/twoslash - Accepts a JSON & Form Data body with the following properties: code, extension, and options.",
    });
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

router.get("/twoslash", async ({ request }) => {
  try {
    console.log({
      method: "get",
      url: request.url,
    });
    const url = new URL(request.url);
    if (!url.search) {
      return Response.json({
        title: "You can send requests in these formats",
        requests: [
          `GET: /twoslash?options={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
          `GET: /twoslash?code=import { hasTransferables } from \"transferables\"&extension=ts&options={"defaultOptions":{"noErrors":true}}`,
          `POST: /twoslash --> JSON Body={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
          `POST: /twoslash --> FormData Body={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
        ],
      });
    }

    const codeParam = url.searchParams.get("code")! || undefined;
    const extensionParam = url.searchParams.get("extension")! ||
      url.searchParams.get("ext")! || undefined;
    const optionsParam = url.searchParams.get("options")! ||
      url.searchParams.get("option")! || "{}";

    const decodedQuery: TwoslashRequestOptions = Object.assign(
      JSON.parse(optionsParam),
      { code: codeParam, extension: extensionParam },
    );
    const { code, extension = "ts", ...opts } = decodedQuery;

    const twoslash = await twoslasher(code, extension, opts);
    console.log("twoslash ", twoslash);
    return Response.json(twoslash);
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

router.post("/twoslash", async ({ request }) => {
  try {
    const headers = request.headers;
    const contentType = headers.get("content-type");
    console.log({
      method: "post",
      url: request.url,
      contentType,
    });
    const { code, extension, ...opts }: TwoslashRequestOptions =
      contentType && /multipart\/form\-data/.test(contentType)
        ? Object.fromEntries((await request.formData()).entries())
        : await request.json();

    const twoslash = await twoslasher(code, extension, opts);
    console.log("twoslash ", twoslash);
    return Response.json(twoslash);
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

router.get("/.well-known/*", async ({ request }) => {
  try {
    const url = new URL(request.url);
    const ext = extname(url.pathname);
    const fileName = basename(url.pathname);
    return new Response(
      await Deno.readFile(join(__dirname, "./.well-known", fileName)),
      {
        status: 200,
        headers: new Headers([
          ["Content-Type", contentType(ext) ?? "application/json"],
        ]),
      },
    );
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

router.get("/favicon/*", async ({ request }) => {
  try {
    const url = new URL(request.url);
    const ext = extname(url.pathname);
    const fileName = basename(url.pathname);
    return new Response(
      await Deno.readFile(join(__dirname, "./favicon", fileName)),
      {
        status: 200,
        headers: new Headers([
          ["Content-Type", contentType(ext) ?? "text/plain"],
        ]),
      },
    );
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

router.get("/favicon.ico", async () => {
  try {
    const ext = ".ico";
    return new Response(
      await Deno.readFile(join(__dirname, "./favicon/favicon.ico")),
      {
        status: 200,
        headers: new Headers([
          ["Content-Type", contentType(ext)],
        ]),
      },
    );
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

const ext = ".svg";
router.get("/favicon.svg", async () => {
  try {
    return new Response(
      await Deno.readFile(join(__dirname, "./favicon/favicon.svg")),
      {
        status: 200,
        headers: new Headers([
          ["Content-Type", contentType(ext)],
        ]),
      },
    );
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ["Content-Type", "text/plain"],
      ]),
    });
  }
});

serve(router.dispatch.bind(router));
