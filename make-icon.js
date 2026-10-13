#!/usr/bin/env node
// 生成应用图标 icon.png（纯 Node 内置模块，零依赖）
// 用法: node make-icon.js [输出路径，默认 ./icon.png]
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SIZE = 256;
const BG = [22, 163, 74];   // 主题绿 --accent #16a34a
const FG = [255, 255, 255]; // 白色哑铃

// ---------- CRC32（PNG 分块校验需要） ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ---------- 像素 ----------
const px = Buffer.alloc(SIZE * SIZE * 4);
function setRGB(x, y, c) { const i = (y * SIZE + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; }
function setA(x, y, a) { px[(y * SIZE + x) * 4 + 3] = a; }
function inCircle(x, y, cx, cy, r) { return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; }

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // 圆角矩形（半径 44），圆角外透明
    const r = 44;
    let outside = false;
    if (x < r && y < r && (r - x) ** 2 + (r - y) ** 2 > r * r) outside = true;
    if (x > SIZE - r && y < r && (x - (SIZE - r)) ** 2 + (r - y) ** 2 > r * r) outside = true;
    if (x < r && y > SIZE - r && (r - x) ** 2 + (y - (SIZE - r)) ** 2 > r * r) outside = true;
    if (x > SIZE - r && y > SIZE - r && (x - (SIZE - r)) ** 2 + (y - (SIZE - r)) ** 2 > r * r) outside = true;
    if (outside) { setRGB(x, y, [0, 0, 0]); setA(x, y, 0); }
    else { setRGB(x, y, BG); setA(x, y, 255); }

    // 白色哑铃：中间横杆 + 两端铃片
    const cy = SIZE / 2;
    const inBar = x >= 70 && x <= 186 && y >= cy - 12 && y <= cy + 12;
    const inL = inCircle(x, y, 64, cy, 36);
    const inR = inCircle(x, y, 192, cy, 36);
    if (inBar || inL || inR) setRGB(x, y, FG);
  }
}

// ---------- 编码 PNG ----------
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA

// 原始扫描行：每行前加 filter byte 0
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const idat = zlib.deflateSync(raw);
const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);

const out = process.argv[2] || path.join(__dirname, "icon.png");
fs.writeFileSync(out, png);
console.log("icon 已生成:", out, png.length, "bytes");
