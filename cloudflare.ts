const DENO_TYPE_PATH = "/@deno-types";

export default {
  async fetch(request, env) {
    try {
      const { pathname, searchParams } = new URL(request.url);

      if (pathname === "/")
        return Response.redirect("https://github.com/okikio/deno-github-proxy");

      const url = new URL(pathname.replace(DENO_TYPE_PATH, ""), `https://raw.githubusercontent.com`);
      const res = await fetch(url);

      const headers = Object.fromEntries([...res.headers]);
      const typescriptTypes = new URL(DENO_TYPE_PATH + url.pathname, "https://github-ts.okikio.workers.dev");
      const finalHeaders = {
        ...headers,
        ...Object.fromEntries([
          ["content-type", searchParams.has("js") ? "text/javascript" : "text/typescript"],
          ['accept-ranges', 'bytes'],
          ['access-control-allow-origin', '*'],
          ['cache-control', 'max-age=30, public'],
          ...(!pathname.startsWith(DENO_TYPE_PATH) ? [['x-typescript-types', typescriptTypes.toString()]] : [])
        ])
      };

      return new Response(await res.arrayBuffer(), {
        headers: finalHeaders,
        status: 200,
      });
    } catch(e) {
      return new Response(JSON.stringify({
        err
      }), { status: 500 })
    }
  }
}