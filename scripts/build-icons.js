const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function generateSvg(size) {
  // Stroke width proportionally scaled for crispness at smaller sizes
  const strokeWidth = size <= 16 ? 14 : size <= 32 ? 12 : 11;
  const rx = Math.round(128 * 0.24); // 30px rounded corners

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="45%" stop-color="#7c3aed" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>
      <linearGradient id="glowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.1)" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)" />
      </filter>
    </defs>
    
    <!-- Squircle Background -->
    <rect x="4" y="4" width="120" height="120" rx="${rx}" fill="url(#bgGrad)" />
    <rect x="5" y="5" width="118" height="118" rx="${rx - 1}" fill="none" stroke="url(#glowBorder)" stroke-width="2" />
    
    <!-- Code Glyph </> -->
    <g filter="url(#shadow)">
      <!-- Left Bracket < -->
      <path d="M 43 43 L 23 64 L 43 85" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Forward Slash / -->
      <path d="M 54 87 L 74 41" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" />
      
      <!-- Right Bracket > -->
      <path d="M 85 43 L 105 64 L 85 85" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </svg>`;
}

function renderIconPng(size, outputPath) {
  const svg = generateSvg(size);
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      * { margin:0; padding:0; box-sizing: border-box; }
      body { width:${size}px; height:${size}px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
      svg { width: 100%; height: 100%; display: block; }
    </style>
  </head>
  <body>
    ${svg}
  </body>
  </html>`;

  const tempHtml = path.resolve(__dirname, `_temp_icon_${size}.html`);
  fs.writeFileSync(tempHtml, html, 'utf8');

  try {
    execSync(
      `"${chromePath}" --headless --disable-gpu --default-background-color=00000000 --screenshot="${outputPath}" --window-size=${size},${size} "file:///${tempHtml.replace(/\\/g, '/')}"`,
      { stdio: 'pipe' }
    );
    console.log(`Generated icon: ${outputPath} (${size}x${size})`);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
  }
}

const iconsDir = path.resolve(__dirname, '../extension/icons');
const storeDir = path.resolve(__dirname, '../chrome-store-upload');
const assetsDir = path.resolve(__dirname, '../store-assets');

[16, 32, 48, 128].forEach(size => {
  renderIconPng(size, path.join(iconsDir, `icon${size}.png`));
});

// Also update store-assets and chrome-store-upload
renderIconPng(128, path.join(storeDir, 'icon-128.png'));
renderIconPng(128, path.join(assetsDir, 'icon-128.png'));

console.log('All icons generated successfully!');
