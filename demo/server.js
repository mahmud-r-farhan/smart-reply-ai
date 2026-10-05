import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, headers);
  res.end(body);
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    return;
  }

  let pathname = "/";
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname);
  } catch {
    send(res, 400, "Bad Request");
    return;
  }

  // Resolve inside DIST_DIR only — protects against `../` traversal.
  const resolved = path.resolve(path.join(DIST_DIR, pathname));
  const isInsideDist = resolved === DIST_DIR || resolved.startsWith(DIST_DIR + path.sep);

  let filePath = isInsideDist ? resolved : null;
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    // SPA fallback
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const isHashedAsset = pathname.startsWith("/assets/");

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        send(res, 404, "Not Found (run `npm run build` first)", { "Content-Type": "text/plain; charset=utf-8" });
      } else {
        console.error("Failed to read", filePath, error.message);
        send(res, 500, "Server Error", { "Content-Type": "text/plain; charset=utf-8" });
      }
      return;
    }

    const headers = {
      "Content-Type": contentType,
      "Cache-Control": isHashedAsset
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    };

    if (req.method === "HEAD") {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    res.writeHead(200, headers);
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Demo showcase server listening on http://localhost:${PORT}`);
  if (!fs.existsSync(DIST_DIR)) {
    console.warn("Warning: `dist/` not found — run `npm run build` before `npm start`.");
  }
});
