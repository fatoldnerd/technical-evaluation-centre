// Preview the static production export; application state stays in the browser.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const index = process.argv.indexOf("--port");
const port = Number(
  index >= 0 ? process.argv[index + 1] : process.env.PORT || 3017,
);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Use a valid --port value.");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(
      root,
      pathname === "/" ? "index.html" : "." + pathname,
    );
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (!["GET", "HEAD"].includes(req.method || "")) {
      res.writeHead(405);
      res.end("Method not allowed");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Technical Evaluation Command Centre: http://localhost:${port}`),
);
