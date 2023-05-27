import { serve, dewy, cors, path, media_types } from "./deps.ts";

const { extname, basename, dirname, fromFileUrl, join } = path;
const { Router } = dewy;
const { contentType } = media_types

const __dirname = dirname(fromFileUrl(import.meta.url));

const router = new Router();
router.use(cors());
router.post("/twoslash", async ({ request }) => {
  const formData = await request.formData();
  // request.
  
  return Response.json({
    message: "Hello World",
  });
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

router.get("/.well-known/*", async ({ request }) => { 
  const url = new URL(request.url);
  const ext = extname(url.pathname);
  const fileName = basename(url.pathname);
  return new Response(await Deno.readFile(join(__dirname, "./.well-known", fileName)), {
    status: 200,
    headers: [
      ['Cache-Control', 'max-age=3600, s-maxage=30, public'],
      ['Content-Type', contentType(ext) ?? "application/json"]
    ],
  })
});

router.get("/articles/:id", ({ match }) => {
  return Response.json({
    id: match.pathname.groups.id,
  });
});

serve(router.dispatch.bind(router));

// serve(async (req: Request) => {
//   let { pathname, searchParams } = new URL(req.url);
//   const urlPattern = new URLPattern({ pathname: "/twoslash" });
  
//   if (urlPattern.test(pathname)) { 
//     const url = new URL(pathname.replace(URL_PATH, ""), `https://raw.githubusercontent.com`);
//     const res = await fetch(url);

//     const headers = Object.fromEntries([...res.headers]);
//     const typescriptTypes = new URL(URL_PATH + url.pathname, "https://github-ts.okikio.workers.dev");
//     const finalHeaders = {
//       ...headers,
//       ...Object.fromEntries([
//         ["content-type", searchParams.has("js") ? "text/javascript" : "text/typescript"],
//         ['accept-ranges', 'bytes'],
//         ['access-control-allow-origin', '*'],
//         ['cache-control', 'max-age=30, public'],
//         ...(!pathname.startsWith(URL_PATH) ? [['x-typescript-types', typescriptTypes.toString()]] : [])
//       ])
//     };

//     return new Response(await res.arrayBuffer(), {
//       headers: finalHeaders,
//       status: 200,
//     });
//   }
// });