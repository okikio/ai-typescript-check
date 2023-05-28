import { serve, dewy, cors, path, media_types } from "./deps.ts";

const { extname, basename, dirname, fromFileUrl, join } = path;
const { Router } = dewy;
const { contentType } = media_types

const __dirname = dirname(fromFileUrl(import.meta.url));

const router = new Router();
router.use(cors());
router.get("/twoslash", async ({ request }) => {
  // const formData = await request.formData();
  // request.

  console.log({ request });
  
  return Response.json({
    message: "Hello World",
  });
});
router.post("/twoslash", async ({ request }) => {
  const headers = request.headers;
  const contentType = headers.get("content-type");
  const json =  contentType && /multipart\/form\-data/.test(contentType) ? 
    Object.fromEntries((await request.formData()).entries()): 
    await request.json();
  
  console.log({ contentType, json });
  
  return Response.json({
    message: "Hello World",
    json
  }, {
    status: 200,
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

router.get("/favicon.svg", async ({ request }) => { 
  const ext = ".svg";
  return new Response(await Deno.readFile(join(__dirname, "./favicon/favicon.svg")), {
    status: 200,
    headers: new Headers([
      ['Content-Type', contentType(ext)]
    ]),
  })
});

router.get("/articles/:id", ({ match }) => {
  return Response.json({
    id: match.pathname.groups.id,
  });
});

serve(router.dispatch.bind(router), { port: 8080 });

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