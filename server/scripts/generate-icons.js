const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Simple CRC32 table & function
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Scanlines (Filter byte 0 + RGBA pixels)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateLeetPushIcon(x, y, w, h) {
  // Normalize coordinates to 0..1
  const nx = x / w;
  const ny = y / h;
  const radius = 0.22; // rounded corner

  // Rounded rectangle background check
  const inLeft = nx < radius;
  const inRight = nx > 1 - radius;
  const inTop = ny < radius;
  const inBottom = ny > 1 - radius;

  let inside = true;
  if (inLeft && inTop) {
    inside = (nx - radius) ** 2 + (ny - radius) ** 2 <= radius ** 2;
  } else if (inRight && inTop) {
    inside = (nx - (1 - radius)) ** 2 + (ny - radius) ** 2 <= radius ** 2;
  } else if (inLeft && inBottom) {
    inside = (nx - radius) ** 2 + (ny - (1 - radius)) ** 2 <= radius ** 2;
  } else if (inRight && inBottom) {
    inside = (nx - (1 - radius)) ** 2 + (ny - (1 - radius)) ** 2 <= radius ** 2;
  }

  if (!inside) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Gradient: LeetCode amber (top-left) to GitHub Indigo/Violet (bottom-right)
  const grad = (nx + ny) / 2;
  const rBg = Math.round(245 * (1 - grad) + 99 * grad);
  const gBg = Math.round(158 * (1 - grad) + 102 * grad);
  const bBg = Math.round(11 * (1 - grad) + 241 * grad);

  // Draw code bracket symbol < / > in crisp white
  // Left bracket <
  const dLeft1 = Math.abs((ny - 0.5) - (0.35 - nx) * 1.5);
  const dLeft2 = Math.abs((0.5 - ny) - (0.35 - nx) * 1.5);
  const isLeftBracket = nx >= 0.2 && nx <= 0.38 && ny >= 0.28 && ny <= 0.72 && (dLeft1 < 0.08 || dLeft2 < 0.08);

  // Right bracket >
  const dRight1 = Math.abs((ny - 0.5) - (nx - 0.65) * 1.5);
  const dRight2 = Math.abs((0.5 - ny) - (nx - 0.65) * 1.5);
  const isRightBracket = nx >= 0.62 && nx <= 0.8 && ny >= 0.28 && ny <= 0.72 && (dRight1 < 0.08 || dRight2 < 0.08);

  // Slash /
  const dSlash = Math.abs((1 - ny) - (nx * 1.1 + 0.1));
  const isSlash = nx >= 0.42 && nx <= 0.58 && ny >= 0.22 && ny <= 0.78 && dSlash < 0.07;

  if (isLeftBracket || isRightBracket || isSlash) {
    return [255, 255, 255, 255]; // Pure White icon glyph
  }

  return [rBg, gBg, bBg, 255];
}

const iconsDir = path.resolve(__dirname, "../../extension/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const png = createPng(size, size, generateLeetPushIcon);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
}

console.log("All extension icons created successfully!");
