// Import necessary modules from dependencies
import { cors, oak, parse, path } from "./deps.ts";
import { twoslasher } from "./vendor/twoslash.ts";
import type { TwoSlashOptions } from "./vendor/twoslash.ts";

// Destructure necessary components from oak (similar to Express.js in Node.js)
const { Application, Router, send, isHttpError, Status } = oak;

// Destructure necessary path utilities from path (similar to path in Node.js)
const { dirname, fromFileUrl, join } = path;

// Get the directory of the current module file
// This is similar to __dirname in Node.js, but Deno uses URLs for modules, so we need to convert from a file URL to a path
const __dirname = dirname(fromFileUrl(import.meta.url));

// Define the shape of the request options for the twoslash route
interface TwoslashRequestOptions extends TwoSlashOptions {
  code: string;
  extension: string;
  // version?: string;
}

// Create a new router (similar to Express.js Router in Node.js)
const router = new Router();

// Define routes
router
  // Root route
  .get("/(index)?(.html)?", async (context) => {
    // Use the send function from oak to serve static files
    // This is similar to express.static in Express.js
    await send(context, "index.html", {
      root: join(__dirname, `./static`),
    });
    context.response.headers.set("Content-Type", "text/html");
  })
  // Root static route
  .get("/static/:fileName", async (context) => {
    const { fileName } = context.params;
    // Use the send function from oak to serve static files
    // This is similar to express.static in Express.js
    await send(context, fileName, {
      root: join(__dirname, `./static`),
    });
  })
  // Route for redirect serving favicon.* files
  .get("/favicon.:ext", (context) => {
    const { ext } = context.params;
    context.response.redirect(`/favicon/favicon.${ext}`);
  })
  // Route openapi.json for a future swagger ui docs route
  .get("/.well-known/openapi.json", async (context) => {
    const uint8arr = await Deno.readFile(
      join(__dirname, `./static/.well-known/openapi.yaml`),
    );
    context.response.body = await parse(
      new TextDecoder().decode(uint8arr),
    ) as Record<string, string>;
  })
  // Route for serving static files
  .get("/:staticPath(.well-known|favicon)/:fileName", async (context) => {
    const { staticPath, fileName } = context.params;
    // Use the send function from oak to serve static files
    // This is similar to express.static in Express.js
    await send(context, fileName, {
      root: join(__dirname, `./static/${staticPath}`),
    });
  })
  // Route for handling OPTIONS requests to /twoslash
  // This is necessary for CORS (Cross-Origin Resource Sharing)
  .options("/twoslash", cors()) // enable pre-flight request for OPTIONS request
  // Route for handling POST requests to /twoslash
  .post("/twoslash", async (context) => {
    const { request } = context;
    const contentType = request.headers.get("content-type");
    console.log({
      twoslash: request.url.pathname,
      method: "post",
      url: request.url,
      contentType,
    });

    const { type, value } = request.body();
    if (type !== "form-data" && type !== "json") {
      context.throw(
        Status.UnsupportedMediaType,
        `${type} isn't a supported content type`,
      );
    }

    // Max file size to handle
    const data: TwoslashRequestOptions = type === "form-data"
      ? (await value.read({ maxSize: 10000000 })).fields
      : await value;
    const { code, extension, ...opts } = data;

    // let tsModule: typeof Typescript;
    // if (version) {
    //   tsModule = await import(`https://esm.sh/typescript@${versionNumber}`).default;
    // }

    const twoslash = await twoslasher(code, extension, opts);
    context.response.body = twoslash;
  })
  // Route for handling GET requests to /twoslash
  .get("/twoslash", async (context) => {
    const { request } = context;

    const url = request.url;
    if (!url.search) {
      context.response.body = {
        title: "You can send requests in these formats",
        requests: [
          `GET: /twoslash?options={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
          `GET: /twoslash?code=import { hasTransferables } from \"transferables\"&extension=ts&options={"defaultOptions":{"noErrors":true}}`,
          `POST: /twoslash --> JSON Body={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
          `POST: /twoslash --> FormData Body={"code":"import { hasTransferables } from \"transferables\"","extension":"ts"}`,
        ],
      };

      return;
    }

    const params = url.searchParams;
    const codeParam = params.get("code")! || undefined;
    const extensionParam = params.get("extension")! ||
      params.get("ext")! ||
      undefined;
    const optionsParam = params.get("options")! ||
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

// Create a new application (similar to Express.js application in Node.js)
const app = new Application();

// Middleware to handle double slashes in the pathname
app.use(async (context, next) => {
  // Get the original path from the request URL
  // Example: originalPath might be "/about//team"
  const originalPath = context.request.url.pathname;

  // Create a "normalized" version of the path where all sequences of one or more slashes are replaced with a single slash
  // Example: normalizedPath will be "/about/team"
  const normalizedPath = originalPath.replace(/\/+/g, "/");

  // If the original path and the normalized path are different, this means that the original path had double slashes (or more)
  if (originalPath !== normalizedPath) {
    // Construct a new URL with the normalized path
    // Example: if the original URL was "http://example.com/about//team", the new URL will be "http://example.com/about/team"
    const { protocol, hostname, search, hash } = context.request.url;
    const newUrl = `${protocol}//${hostname}${normalizedPath}${search}${hash}`;

    // Redirect to the new URL
    context.response.redirect(newUrl);
  } else {
    // If the original path and the normalized path are the same, this means that the original path did not have any double slashes
    // So, just pass control to the next middleware function
    await next();
  }
});

// Error handling middleware
app.use(async (context, next) => {
  try {
    // Pass control to the next middleware function
    // If any of them throws an error, it will be caught here
    await next();
  } catch (err) {
    // Check if the error is an HTTP error (e.g., an error thrown by the oak framework)
    if (isHttpError(err)) {
      // Set the response status to the error status
      context.response.status = err.status;
      const { message, status, stack } = err;
      // If the client accepts JSON, send the error details as a JSON object
      if (context.request.accepts("json")) {
        context.response.body = { message, status, stack };
        context.response.type = "json";
      } else {
        // Otherwise, send the error details as plain text
        context.response.body = `${status} ${message}\n\n${stack ?? ""}`;
        context.response.type = "text/plain";
      }
    } else {
      // If the error is not an HTTP error, it's an unexpected error
      // In this case, set the response status to 500 and send a generic error message
      context.response.status = 500;
      context.response.body = "Internal server error";
      // Also log the error to the console for debugging
      console.error(err);
    }
  }
});

// Enable CORS for all routes
// This is necessary for the API to be accessed from different origins
app.use(cors());

// Use the router's routes in the application
app.use(router.routes());

// 404 middleware
// This function will be called if no previous route or middleware function sends a response
app.use((context) => {
  // Set the response status to 404 and send a simple error message
  context.response.status = Status.NotFound;
  context.response.body = "404 Not Found";
});

// Start the application and make it listen on port 8000
console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });
