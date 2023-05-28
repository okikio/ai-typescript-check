import { serve, dewy, cors, path, media_types } from "./deps.ts";
import { twoslasher } from "./vendor/twoslash.ts";
import type { TwoSlashOptions } from "./vendor/twoslash.ts";

const { extname, basename, dirname, fromFileUrl, join } = path;
const { Router } = dewy;
const { contentType } = media_types

const __dirname = dirname(fromFileUrl(import.meta.url));

interface TwoslashRequestOptions extends TwoSlashOptions {
  code: string;
  extension: string;
}

const router = new Router();
router.use(cors());
router.get("/", () => {
  return Response.json({
    message: "Hello World! The API is working!",
    POST: "/twoslash - Accepts a JSON & Form Data body with the following properties: code, extension, and options."
  })
});

router.get("/twoslash", async ({ request }) => {
  const url = new URL(request.url);
  const decodedQuery: TwoslashRequestOptions = JSON.parse(url.searchParams.get("options")!)
  const { code, extension, ...opts } = decodedQuery;

  try {
    const twoslash = await twoslasher(code, extension, opts);
    console.log("twoslash ", twoslash);
    return Response.json(twoslash);
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ['Content-Type', "text/plain"]
      ]),
    });
  }
});

router.post("/twoslash", async ({ request }) => {
  const headers = request.headers;
  const contentType = headers.get("content-type");
  const { code, extension, ...opts }: TwoslashRequestOptions = contentType && /multipart\/form\-data/.test(contentType) ? 
    Object.fromEntries((await request.formData()).entries()): 
    await request.json();

  try {
    const twoslash = await twoslasher(code, extension, opts);
    console.log("twoslash ", twoslash);
    return Response.json(twoslash);
  } catch (e) {
    return new Response(e.toString(), {
      status: 400,
      headers: new Headers([
        ['Content-Type', "text/plain"]
      ]),
    });
  }
});

router.get("/.well-known/*", async ({ request }) => { 
  const url = new URL(request.url);
  const ext = extname(url.pathname);
  const fileName = basename(url.pathname);
  return new Response(await Deno.readFile(join(__dirname, "./.well-known", fileName)), {
    status: 200,
    headers: new Headers([
      ['Content-Type', contentType(ext) ?? "application/json"]
    ]),
  })
});

router.get("/favicon/*", async ({ request }) => { 
  const url = new URL(request.url);
  const ext = extname(url.pathname);
  const fileName = basename(url.pathname);
  return new Response(await Deno.readFile(join(__dirname, "./favicon", fileName)), {
    status: 200,
    headers: new Headers([
      ['Content-Type', contentType(ext) ?? "text/plain"]
    ]),
  })
});

router.get("/favicon.ico", async () => { 
  const ext = ".ico";
  return new Response(await Deno.readFile(join(__dirname, "./favicon/favicon.ico")), {
    status: 200,
    headers: new Headers([
      ['Content-Type', contentType(ext)]
    ]),
  })
});

router.get("/favicon.svg", async () => { 
  const ext = ".svg";
  return new Response(await Deno.readFile(join(__dirname, "./favicon/favicon.svg")), {
    status: 200,
    headers: new Headers([
      ['Content-Type', contentType(ext)]
    ]),
  })
});

serve(router.dispatch.bind(router));
