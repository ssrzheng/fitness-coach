// 本地服务器:让 fitness-coach 把数据自动落盘到工作间 data.json(无需每天手动导出)
// 用法: node server.js   然后浏览器打开 http://localhost:8765
// 纯 Node 内置模块,零依赖。
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const BASE = __dirname;                 // fitness-coach 目录
const DATA = path.join(BASE, "data.json");
const PHOTOS = path.join(BASE, "photos");
const PORT = process.env.PORT || 8765;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp"
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 12 * 1024 * 1024) { reject(new Error("body too large")); req.destroy(); return; }
      data += c;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJSON(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(s);
}

function servePhoto(res, file) {
  const safe = path.basename(file); // 防目录穿越
  const fp = path.join(PHOTOS, safe);
  if (!fp.startsWith(PHOTOS)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = new URL(req.url, "http://x").pathname; } catch (e) { pathname = "/"; }

  // 读取数据
  if (req.method === "GET" && pathname === "/api/data") {
    fs.readFile(DATA, "utf8", (err, txt) => {
      if (err) return sendJSON(res, 200, { profile: null, body: [], training: [], diet: [] });
      try { return sendJSON(res, 200, JSON.parse(txt)); }
      catch (e) { return sendJSON(res, 200, { profile: null, body: [], training: [], diet: [] }); }
    });
    return;
  }

  // 写入数据(原子写)
  if (req.method === "POST" && pathname === "/api/data") {
    try {
      const txt = await readBody(req);
      const obj = JSON.parse(txt);
      if (typeof obj !== "object" || obj === null) return sendJSON(res, 400, { error: "invalid" });
      const tmp = DATA + ".tmp";
      fs.writeFile(tmp, JSON.stringify(obj, null, 2), (we) => {
        if (we) return sendJSON(res, 500, { error: "write failed" });
        fs.rename(tmp, DATA, (re) => {
          if (re) return sendJSON(res, 500, { error: "rename failed" });
          sendJSON(res, 200, { ok: true });
        });
      });
    } catch (e) { sendJSON(res, 400, { error: "bad json" }); }
    return;
  }

  // 上传照片
  if (req.method === "POST" && pathname === "/api/photo") {
    try {
      const txt = await readBody(req);
      const obj = JSON.parse(txt);
      const name = path.basename(String(obj.name || ""));
      const data = String(obj.data || "");
      const m = data.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
      if (!name || !m) return sendJSON(res, 400, { error: "invalid photo" });
      fs.mkdir(PHOTOS, { recursive: true }, (me) => {
        if (me) return sendJSON(res, 500, { error: "mkdir failed" });
        fs.writeFile(path.join(PHOTOS, name), Buffer.from(m[1], "base64"), (we) => {
          if (we) return sendJSON(res, 500, { error: "write failed" });
          sendJSON(res, 200, { path: "/photos/" + name });
        });
      });
    } catch (e) { sendJSON(res, 400, { error: "bad json" }); }
    return;
  }

  // 照片文件
  if (req.method === "GET" && pathname.startsWith("/photos/")) {
    servePhoto(res, pathname.slice("/photos/".length));
    return;
  }

  // 首页
  if (pathname === "/" || pathname === "/index.html") {
    fs.readFile(path.join(BASE, "index.html"), (err, buf) => {
      if (err) { res.writeHead(500); res.end("index.html missing"); return; }
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(buf);
    });
    return;
  }

  res.writeHead(404); res.end("not found");
});

server.listen(PORT, () => {
  console.log("fitness-coach 本地服务器已启动: http://localhost:" + PORT);
  console.log("数据自动写入: " + DATA);
});
