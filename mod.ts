import { cors, oak, path } from "./deps.ts";
import { twoslasher } from "./vendor/twoslash.ts";
import type { TwoSlashOptions } from "./vendor/twoslash.ts";

const { Application, Router, send, isHttpError, Status } = oak;

const { dirname, fromFileUrl, join } = path;
const __dirname = dirname(fromFileUrl(import.meta.url));

interface TwoslashRequestOptions extends TwoSlashOptions {
  code: string;
  extension: string;
}

const router = new Router();
router
  .get("/", (context) => {
    context.response.body = ({
      hey: "Hello World! The API is working!",
      message:
        "/twoslash - Accepts a JSON & Form Data body with the following properties: code, extension, and options.",
    })
  })
  .get("/.well-known/(.*)", async (context) => {
    await send(context, context.request.url.pathname.replace("/.well-known", ""), {
      root: join(Deno.cwd(), "./.well-known"),
      index: "ai-plugin.json",
    });
  })
  .get("/favicon/(.*)", async (context) => {
    await send(context, context.request.url.pathname.replace("/favicon", ""), {
      root: join(__dirname, "./favicon"),
      index: "favicon.svg",
    });
  })
  .get("/favicon.svg", async (context) => {    
    await send(context, context.request.url.pathname, {
      root: join(__dirname, "./favicon"),
      index: "favicon.svg",
    });
  })
  .get("/favicon.ico", async (context) => {    
    await send(context, context.request.url.pathname, {
      root: join(__dirname, "./favicon"),
      index: "favicon.ico",
    });
  })
  .options("/twoslash", cors()) // enable pre-flight request for OPTIONS request
  .post("/twoslash", async (context) => {
    const { request } = context;
    const contentType = request.headers.get("content-type");
    console.log({
      method: "post",
      url: request.url,
      contentType,
    });
    
    const { type, value } = request.body();
    if (type !== "form-data" && type !== "json") context.throw(Status.UnsupportedMediaType, `${type} isn't a supported content type`);
    
    // Max file size to handle
    const data: TwoslashRequestOptions = type === "form-data" ? (await value.read({ maxSize: 10000000 })).fields : await value; 
    const { code, extension, ...opts }  = data;

    const twoslash = await twoslasher(code, extension, opts);
    console.log("twoslash ", twoslash);
    context.response.body = twoslash;
  })
  .get("/twoslash", async (context) => {
    const { request } = context;

    const url = request.url;
    if (!url.search) {
      context.response.body = ({
        title: "You can send requests in these formats",
        requests: [
          `GET: /twoslash?options={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
          `GET: /twoslash?code=import { hasTransferables } from \"transferables\"&extension=ts&options={"defaultOptions":{"noErrors":true}}`,
          `POST: /twoslash --> JSON Body={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
          `POST: /twoslash --> FormData Body={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
        ],
      });

      return;
    } 

    const params = url.searchParams;
    const codeParam = params.get("code")! || undefined;
    const extensionParam = 
      params.get("extension")! ||
      params.get("ext")! || 
      undefined;
    const optionsParam = 
      params.get("options")! || 
      params.get("option")! || 
      "{}";

    const decodedQuery: TwoslashRequestOptions = Object.assign(
      { code: codeParam, extension: extensionParam },
      JSON.parse(optionsParam),
    );
    const { code, extension = "ts", ...opts } = decodedQuery;

    const twoslash = await twoslasher(code, extension, opts);
    console.log("twoslash ", twoslash);
    context.response.body = twoslash;
  });

const app = new Application();
app.use(async (context, next) => {
  try {
    await next();
  } catch (err) {
    if (isHttpError(err)) {
      context.response.status = err.status;
      const { message, status, stack } = err;
      if (context.request.accepts("json")) {
        context.response.body = { message, status, stack };
        context.response.type = "json";
      } else {
        context.response.body = `${status} ${message}\n\n${stack ?? ""}`;
        context.response.type = "text/plain";
      }
    } else {
      // handle all other Errors
      context.response.status = 500;
      context.response.body = "Internal server error";
      console.error(err);
    }
  }
});

app.use(cors()); // Enable CORS for All Routes
app.use(router.routes());

// 404 middleware
app.use((context) => {
  context.response.status = Status.NotFound;
  context.response.body = "404 Not Found";
});

console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });