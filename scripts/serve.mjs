import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../site");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
export function publicPath(raw) {
  try {
    const decoded = decodeURIComponent(raw.split("?")[0]);
    if (
      decoded.includes("\\") ||
      decoded.includes("\0") ||
      decoded.split("/").some((x) => x === "..")
    )
      return null;
    const pathname = decoded.replace(/^\/ecovecinos(?=\/|$)/, "") || "/";
    const path = resolve(root, "." + pathname);
    return path === root || path.startsWith(root + sep) ? path : null;
  } catch {
    return null;
  }
}
export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    let path = publicPath(request.url);
    if (!path) {
      response.writeHead(403);
      response.end("No disponible");
      return;
    }
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
      const data = await readFile(path);
      response.setHeader(
        "Content-Type",
        types[extname(path)] || "application/octet-stream",
      );
      response.writeHead(200);
      response.end(request.method === "HEAD" ? undefined : data);
    } catch {
      response.writeHead(404);
      response.end("No encontrado");
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4321);
  const host = process.env.HOST || "127.0.0.1";
  createPreviewServer().listen(port, host, () =>
    console.log(
      `Vista previa de ECO-VECINOS: http://${host}:${port}/ecovecinos/ — solo site/`,
    ),
  );
}
