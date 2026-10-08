const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const uploadedImagePath = 'C:\\Users\\RIKKY\\.gemini\\antigravity-ide\\brain\\46722b2e-5b53-47b8-96f8-22fb72c2c084\\.user_uploaded\\media_1791458846499.png';

const imgBuf = fs.readFileSync(uploadedImagePath);
const base64Img = `data:image/png;base64,${imgBuf.toString('base64')}`;

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body { width: 1280px; height: 800px; background: #0a0d14; color: #f1f5f9; overflow: hidden; position: relative; }
  .glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%); top: -150px; left: -100px; pointer-events: none; }
  .glow-2 { position: absolute; width: 550px; height: 550px; border-radius: 50%; filter: blur(140px); background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%); bottom: -120px; right: -100px; pointer-events: none; }
  .canvas { position: relative; width: 100%; height: 100%; padding: 32px 50px; display: flex; flex-direction: column; justify-content: space-between; z-index: 2; }
  .header { display: flex; justify-content: space-between; align-items: center; }
  .logo-badge { display: flex; align-items: center; gap: 14px; }
  .logo-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b, #6366f1); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35); }
  .brand-text h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; background: linear-gradient(135deg, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .brand-text p { font-size: 13px; color: #94a3b8; }
  .pill-tag { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
  .headline-wrap { text-align: center; margin: 10px 0 16px 0; }
  .headline-wrap h2 { font-size: 34px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
  .gradient-text { background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .headline-wrap p { font-size: 15px; color: #94a3b8; }
  
  .browser-frame { 
    background: #0d1117; 
    border: 1px solid rgba(255, 255, 255, 0.15); 
    border-radius: 14px; 
    overflow: hidden; 
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55); 
    display: flex; 
    flex-direction: column;
    max-width: 1100px;
    margin: 0 auto;
  }
  .browser-top { 
    background: #161b22; 
    padding: 10px 16px; 
    display: flex; 
    align-items: center; 
    gap: 14px; 
    border-bottom: 1px solid rgba(255, 255, 255, 0.08); 
  }
  .dots { display: flex; gap: 6px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot-red { background: #ef4444; } .dot-yellow { background: #f59e0b; } .dot-green { background: #10b981; }
  .url-bar { 
    flex: 1; 
    background: #0d1117; 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    border-radius: 6px; 
    padding: 5px 12px; 
    font-size: 12px; 
    color: #8b949e; 
    font-family: monospace; 
    display: flex; 
    align-items: center; 
    gap: 8px; 
  }
  .browser-body { display: flex; align-items: center; justify-content: center; background: #010409; }
  .browser-body img { width: 100%; height: auto; display: block; object-fit: contain; }
  
  .feature-pills { display: flex; justify-content: center; gap: 16px; margin-top: 16px; }
  .feature-pill { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); padding: 7px 16px; border-radius: 30px; font-size: 13.5px; color: #cbd5e1; display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .check-icon { color: #10b981; font-weight: bold; }
`;

const html = `<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="glow-1"></div><div class="glow-2"></div>
  <div class="canvas">
    <div class="header">
      <div class="logo-badge">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>LeetPush</h1>
          <p>GitHub Fine-Grained Security</p>
        </div>
      </div>
      <div class="pill-tag">SECURITY FIRST &bull; REPO SCOPED</div>
    </div>

    <div class="headline-wrap">
      <h2>Secure <span class="gradient-text">Personal Access Token</span> Integration</h2>
      <p>Works seamlessly with GitHub Fine-Grained Tokens. Scoped strictly to your solutions repository.</p>
    </div>

    <div class="browser-frame">
      <div class="browser-top">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <div class="url-bar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          https://github.com/settings/personal-access-tokens
        </div>
      </div>
      <div class="browser-body">
        <img src="${base64Img}" alt="GitHub Token Settings" />
      </div>
    </div>

    <div class="feature-pills">
      <div class="feature-pill"><span class="check-icon">✓</span> Minimal Repository Scope</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Fine-Grained Token Support</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Stored Strictly in Chrome Local Storage</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Zero Account-Wide Permissions</div>
    </div>
  </div>
</body>
</html>`;

function renderImage(outputPath, format) {
  const tempHtml = path.resolve(__dirname, `_temp_token_${Date.now()}.html`);
  fs.writeFileSync(tempHtml, html, 'utf8');
  const fileUrl = 'file:///' + tempHtml.replace(/\\/g, '/');

  try {
    execSync(
      `"${chromePath}" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --screenshot="${outputPath}" --window-size=1280,800 "${fileUrl}"`,
      { stdio: 'pipe' }
    );
    console.log(`✓ Generated: ${path.basename(outputPath)} (${format})`);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
  }
}

const storeAssetsDir = path.resolve(__dirname, '../store-assets');
const chromeUploadDir = path.resolve(__dirname, '../chrome-store-upload');

const outJpg1 = path.join(storeAssetsDir, 'screenshot-4-token-setup.jpg');
const outPng1 = path.join(storeAssetsDir, 'screenshot-4-token-setup.png');
const outJpg2 = path.join(chromeUploadDir, 'screenshot-4-token-setup.jpg');
const outPng2 = path.join(chromeUploadDir, 'screenshot-4-token-setup.png');

renderImage(outJpg1, '1280x800 JPEG');
renderImage(outPng1, '1280x800 PNG');
fs.copyFileSync(outJpg1, outJpg2);
fs.copyFileSync(outPng1, outPng2);

console.log('Token screenshot successfully created and added to store assets!');
