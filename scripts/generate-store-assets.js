const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const storeAssetsDir = path.resolve(__dirname, '../store-assets');

if (!fs.existsSync(storeAssetsDir)) {
  fs.mkdirSync(storeAssetsDir, { recursive: true });
}

function renderHtmlToImage(html, outputPath, width, height) {
  const tempHtml = path.resolve(__dirname, `_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtml, html, 'utf8');

  const fileUrl = 'file:///' + tempHtml.replace(/\\/g, '/');
  try {
    execSync(
      `"${chromePath}" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --screenshot="${outputPath}" --window-size=${width},${height} "${fileUrl}"`,
      { stdio: 'pipe' }
    );
    console.log(`✓ Rendered: ${path.basename(outputPath)} (${width}x${height})`);
  } finally {
    if (fs.existsSync(tempHtml)) {
      fs.unlinkSync(tempHtml);
    }
  }
}

// Common CSS styles
const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body { background: #0a0d14; color: #f1f5f9; overflow: hidden; }
  .glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%); top: -150px; left: -100px; pointer-events: none; }
  .glow-2 { position: absolute; width: 550px; height: 550px; border-radius: 50%; filter: blur(140px); background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%); bottom: -120px; right: -100px; pointer-events: none; }
  .canvas { position: relative; width: 100%; height: 100%; padding: 40px 60px; display: flex; flex-direction: column; justify-content: space-between; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .logo-badge { display: flex; align-items: center; gap: 14px; }
  .logo-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b, #6366f1); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35); }
  .brand-text h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; background: linear-gradient(135deg, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .brand-text p { font-size: 13px; color: #94a3b8; }
  .pill-tag { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
  .headline-wrap { text-align: center; margin-bottom: 24px; }
  .headline-wrap h2 { font-size: 38px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; line-height: 1.2; }
  .gradient-text { background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .headline-wrap p { font-size: 17px; color: #94a3b8; }
  .card { background: rgba(18, 26, 43, 0.75); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; backdrop-filter: blur(20px); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4); }
  .feature-pills { display: flex; justify-content: center; gap: 16px; margin-top: 24px; }
  .feature-pill { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); padding: 8px 18px; border-radius: 30px; font-size: 14px; color: #cbd5e1; display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .check-icon { color: #10b981; font-weight: bold; }
`;

// 1. Screenshot 1: LeetCode Problem & Instant Sync
const screenshot1Html = `<!DOCTYPE html>
<html>
<head><style>${baseStyles}
  .mockup-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; flex: 1; align-items: center; }
  .code-window { padding: 24px; font-family: monospace; }
  .window-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; }
  .dots { display: flex; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-red { background: #ef4444; } .dot-yellow { background: #f59e0b; } .dot-green { background: #10b981; }
  .problem-tag { color: #f59e0b; font-weight: 600; font-size: 14px; }
  .verdict-box { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .verdict-title { font-size: 18px; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px; }
  .verdict-stats { font-size: 13px; color: #a7f3d0; }
  .code-snippet { background: #07090e; padding: 16px; border-radius: 10px; font-size: 13px; color: #cbd5e1; line-height: 1.6; }
  .kw { color: #f43f5e; } .fn { color: #38bdf8; } .str { color: #a3e635; } .com { color: #64748b; }
  .overlay-card { padding: 28px; border: 1px solid rgba(99, 102, 241, 0.35); box-shadow: 0 16px 40px rgba(99, 102, 241, 0.2); }
  .overlay-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; color: #fff; }
  .sync-badge { background: #10b981; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
  .repo-path { background: #07090e; padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); font-family: monospace; font-size: 13px; color: #818cf8; margin: 16px 0; word-break: break-all; }
  .commit-box { font-size: 13px; color: #94a3b8; display: flex; flex-direction: column; gap: 6px; }
  .commit-hash { color: #38bdf8; font-weight: 600; }
</style></head>
<body>
  <div class="glow-1"></div><div class="glow-2"></div>
  <div class="canvas">
    <div class="header">
      <div class="logo-badge">
        <div class="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></div>
        <div class="brand-text"><h1>LeetPush</h1><p>LeetCode to GitHub Auto-Pusher</p></div>
      </div>
      <div class="pill-tag">MANIFEST V3 &bull; INSTANT SYNC</div>
    </div>
    <div class="headline-wrap">
      <h2>Solve on LeetCode. <span class="gradient-text">Auto-Sync to GitHub.</span></h2>
      <p>Zero terminal commands. Zero manual copy-pasting. Instant Git commit on Accepted.</p>
    </div>
    <div class="mockup-grid">
      <div class="card code-window">
        <div class="window-top">
          <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
          <span class="problem-tag">1. Two Sum (Easy)</span>
          <span style="font-size:12px; color:#94a3b8;">Python 3</span>
        </div>
        <div class="verdict-box">
          <div class="verdict-title"><span>✓</span> Accepted</div>
          <div class="verdict-stats">Runtime: 44 ms (Beats 91.2%) &bull; Memory: 17.8 MB</div>
        </div>
        <div class="code-snippet">
          <span class="kw">class</span> Solution:<br>
          &nbsp;&nbsp;<span class="kw">def</span> <span class="fn">twoSum</span>(self, nums: List[int], target: int) -&gt; List[int]:<br>
          &nbsp;&nbsp;&nbsp;&nbsp;seen = {}<br>
          &nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">for</span> i, n <span class="kw">in</span> enumerate(nums):<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;diff = target - n<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> diff <span class="kw">in</span> seen: <span class="kw">return</span> [seen[diff], i]<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;seen[n] = i
        </div>
      </div>
      <div class="card overlay-card">
        <div class="overlay-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Pushed to GitHub
          <span class="sync-badge">MAIN BRANCH</span>
        </div>
        <p style="font-size:14px; color:#cbd5e1; margin-top:8px;">Exact accepted code synced directly to your repository with automated problem README description.</p>
        <div class="repo-path">
          📂 leetcode/two-sum/solution.py<br>
          📄 leetcode/two-sum/README.md
        </div>
        <div class="commit-box">
          <div>Git Commit: <span class="commit-hash">Sync: Two Sum [Easy] (Python3)</span></div>
          <div>Status: <span style="color:#10b981; font-weight:600;">201 Created &bull; Synced in 0.4s</span></div>
        </div>
      </div>
    </div>
    <div class="feature-pills">
      <div class="feature-pill"><span class="check-icon">✓</span> Dual-Tier Code Interception</div>
      <div class="feature-pill"><span class="check-icon">✓</span> SHA-256 Anti-Duplicate Filtering</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Supports 18+ Programming Languages</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Zero Background Terminal Needed</div>
    </div>
  </div>
</body></html>`;

// 2. Screenshot 2: Extension Popup UI & Setup
const screenshot2Html = `<!DOCTYPE html>
<html>
<head><style>${baseStyles}
  .content-area { display: flex; align-items: center; justify-content: center; gap: 60px; flex: 1; }
  .popup-frame { width: 340px; background: #0b0f19; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); padding: 18px; }
  .popup-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; }
  .pop-brand { display: flex; align-items: center; gap: 8px; }
  .pop-brand h3 { font-size: 16px; font-weight: 700; color: #fff; }
  .pop-ver { font-size: 11px; background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 6px; border-radius: 6px; }
  .pop-status { font-size: 11px; color: #34d399; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
  .input-block { margin-bottom: 12px; }
  .input-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 6px; display: block; }
  .mock-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #f1f5f9; font-family: monospace; }
  .btn-conn { width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; border-radius: 8px; padding: 10px; font-weight: 600; font-size: 13px; margin-top: 6px; cursor: pointer; }
  .sub-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; margin-top: 14px; }
  .sub-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .sub-title { font-size: 13px; font-weight: 600; color: #fff; }
  .sub-badge { font-size: 10px; background: rgba(99,102,241,0.2); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; }
  .sub-meta { font-size: 11px; color: #10b981; font-weight: 600; margin-bottom: 4px; }
  .sub-path { font-size: 11px; color: #64748b; font-family: monospace; }
  .feature-list { display: flex; flex-direction: column; gap: 18px; max-width: 500px; }
  .feat-item { display: flex; gap: 16px; align-items: flex-start; }
  .feat-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); display: flex; align-items: center; justify-content: center; color: #818cf8; flex-shrink: 0; }
  .feat-info h3 { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .feat-info p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
</style></head>
<body>
  <div class="glow-1"></div><div class="glow-2"></div>
  <div class="canvas">
    <div class="header">
      <div class="logo-badge">
        <div class="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></div>
        <div class="brand-text"><h1>LeetPush</h1><p>Clean &amp; Minimalist Extension Interface</p></div>
      </div>
      <div class="pill-tag">1-CLICK GITHUB INTEGRATION</div>
    </div>
    <div class="content-area">
      <div class="popup-frame">
        <div class="popup-hdr">
          <div class="pop-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            <h3>LeetPush</h3>
            <span class="pop-ver">v1.0.0</span>
          </div>
          <span class="pop-status">● Connected</span>
        </div>
        <div class="input-block">
          <label class="input-lbl">GITHUB REPOSITORY</label>
          <div class="mock-input">username/leetcode-solutions</div>
        </div>
        <div class="input-block">
          <label class="input-lbl">PERSONAL ACCESS TOKEN</label>
          <div class="mock-input">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</div>
        </div>
        <button class="btn-conn">✓ Connected to main</button>
        <div class="sub-card">
          <div class="sub-hdr">
            <span class="sub-title">1. Two Sum</span>
            <span class="sub-badge">Python 3</span>
          </div>
          <div class="sub-meta">✅ Pushed Just Now</div>
          <div class="sub-path">leetcode/two-sum/solution.py</div>
        </div>
      </div>
      <div class="feature-list">
        <div class="feat-item">
          <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
          <div class="feat-info">
            <h3>Super Fast 60-Second Setup</h3>
            <p>Paste your GitHub repository link, enter your GitHub token, and start practicing. No server or CLI required.</p>
          </div>
        </div>
        <div class="feat-item">
          <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <div class="feat-info">
            <h3>Secure &amp; Private</h3>
            <p>Your access token is kept strictly in private browser storage. No intermediate backend server ever touches your credentials.</p>
          </div>
        </div>
        <div class="feat-item">
          <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></div>
          <div class="feat-info">
            <h3>Live Submission History</h3>
            <p>Direct 1-click links to view newly committed solutions right on GitHub immediately after solving.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body></html>`;

// 3. Screenshot 3: Organized GitHub Portfolio
const screenshot3Html = `<!DOCTYPE html>
<html>
<head><style>${baseStyles}
  .repo-mockup { display: grid; grid-template-columns: 1fr 1.2fr; gap: 28px; flex: 1; align-items: center; }
  .file-tree { padding: 24px; font-family: monospace; font-size: 13px; line-height: 1.8; color: #cbd5e1; }
  .tree-folder { color: #818cf8; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .tree-file { color: #e2e8f0; display: flex; align-items: center; gap: 8px; margin-left: 24px; }
  .tree-com { color: #64748b; font-size: 12px; margin-left: auto; }
  .readme-preview { padding: 26px; }
  .readme-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
  .badge-diff { background: #10b981; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; }
  .badge-lang { background: #3b82f6; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; }
  .readme-body { font-size: 13.5px; color: #94a3b8; line-height: 1.6; margin-top: 14px; }
  .perf-stats { display: flex; gap: 16px; margin: 18px 0; }
  .perf-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 14px; flex: 1; text-align: center; }
  .perf-val { font-size: 16px; font-weight: 700; color: #38bdf8; }
  .perf-lbl { font-size: 11px; color: #64748b; margin-top: 2px; }
</style></head>
<body>
  <div class="glow-1"></div><div class="glow-2"></div>
  <div class="canvas">
    <div class="header">
      <div class="logo-badge">
        <div class="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></div>
        <div class="brand-text"><h1>LeetPush</h1><p>Automated Portfolio Organization</p></div>
      </div>
      <div class="pill-tag">PORTFOLIO READY &bull; CLEAN DIRECTORIES</div>
    </div>
    <div class="headline-wrap">
      <h2>Transform Your Solutions into a <span class="gradient-text">Showcase Portfolio</span></h2>
      <p>Clean multi-language folders, automated problem READMEs, and Git commit histories.</p>
    </div>
    <div class="repo-mockup">
      <div class="card file-tree">
        <div style="font-weight:700; color:#fff; margin-bottom:14px; font-size:14px;">📁 your-github-repo/leetcode/</div>
        <div class="tree-folder">📁 two-sum/</div>
        <div class="tree-file"><span>📄</span> solution.py <span class="tree-com">Python 3</span></div>
        <div class="tree-file"><span>📄</span> README.md <span class="tree-com">Generated</span></div>
        <div class="tree-folder" style="margin-top:8px;">📁 valid-parentheses/</div>
        <div class="tree-file"><span>📄</span> solution.cpp <span class="tree-com">C++</span></div>
        <div class="tree-file"><span>📄</span> solution.java <span class="tree-com">Java</span></div>
        <div class="tree-file"><span>📄</span> README.md <span class="tree-com">Generated</span></div>
        <div class="tree-folder" style="margin-top:8px;">📁 longest-consecutive-sequence/</div>
        <div class="tree-file"><span>📄</span> solution.rs <span class="tree-com">Rust</span></div>
        <div class="tree-file"><span>📄</span> README.md <span class="tree-com">Generated</span></div>
      </div>
      <div class="card readme-preview">
        <div class="readme-title">
          <span># 1. Two Sum</span>
          <span class="badge-diff">Easy</span>
          <span class="badge-lang">Python 3</span>
        </div>
        <div class="perf-stats">
          <div class="perf-box"><div class="perf-val">44 ms</div><div class="perf-lbl">Runtime (Beats 91%)</div></div>
          <div class="perf-box"><div class="perf-val">17.8 MB</div><div class="perf-lbl">Memory (Beats 82%)</div></div>
          <div class="perf-box"><div class="perf-val">O(n)</div><div class="perf-lbl">Time Complexity</div></div>
        </div>
        <div class="readme-body">
          <p><strong>Description:</strong> Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.</p>
          <p style="margin-top:8px;">You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
        </div>
      </div>
    </div>
    <div class="feature-pills">
      <div class="feature-pill"><span class="check-icon">✓</span> Multi-Language Co-existence</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Automated README Creation</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Meaningful Git Commit Messages</div>
      <div class="feature-pill"><span class="check-icon">✓</span> Ready for Technical Interviews</div>
    </div>
  </div>
</body></html>`;

// 4. Promo Small Tile (440x280)
const promoSmallHtml = `<!DOCTYPE html>
<html>
<head><style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { width: 440px; height: 280px; background: #0a0d14; color: #fff; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; text-align: center; }
  .glow { position: absolute; width: 300px; height: 300px; border-radius: 50%; filter: blur(90px); background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%); }
  .logo-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #f59e0b, #6366f1); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); margin-bottom: 14px; position: relative; z-index: 2; }
  h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; position: relative; z-index: 2; }
  p { font-size: 13px; color: #94a3b8; max-width: 320px; line-height: 1.4; position: relative; z-index: 2; margin-bottom: 14px; }
  .tag { background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; position: relative; z-index: 2; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="logo-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></div>
  <h1>LeetPush</h1>
  <p>Automatically push accepted LeetCode solutions directly to your GitHub repo.</p>
  <div class="tag">MANIFEST V3 &bull; ZERO FRICTION</div>
</body></html>`;

// 5. Promo Marquee Tile (1400x560)
const promoMarqueeHtml = `<!DOCTYPE html>
<html>
<head><style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { width: 1400px; height: 560px; background: #0a0d14; color: #fff; overflow: hidden; display: flex; align-items: center; justify-content: space-between; padding: 60px 100px; position: relative; }
  .glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%); top: -100px; left: -100px; }
  .glow-2 { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%); bottom: -100px; right: -100px; }
  .left-content { max-width: 650px; position: relative; z-index: 2; }
  .brand-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  .logo-icon { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #f59e0b, #6366f1); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); }
  .brand-title { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
  .brand-pill { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 8px; }
  h1 { font-size: 46px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.15; margin-bottom: 16px; }
  .grad { background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  p { font-size: 18px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
  .badges { display: flex; gap: 12px; }
  .b-item { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; font-weight: 500; }
  .right-preview { position: relative; z-index: 2; width: 440px; background: rgba(18, 26, 43, 0.8); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 28px; backdrop-filter: blur(20px); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
  .box-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; }
  .box-verdict { font-size: 18px; font-weight: 700; color: #34d399; }
  .box-repo { background: #07090e; padding: 14px; border-radius: 10px; font-family: monospace; font-size: 13px; color: #818cf8; margin-bottom: 14px; }
</style></head>
<body>
  <div class="glow-1"></div><div class="glow-2"></div>
  <div class="left-content">
    <div class="brand-row">
      <div class="logo-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></div>
      <div class="brand-title">LeetPush</div>
      <span class="brand-pill">Chrome Extension (MV3)</span>
    </div>
    <h1>LeetCode to GitHub <br><span class="grad">Zero-Friction Auto-Pusher</span></h1>
    <p>Practice coding questions without disruption. Accepted submissions automatically commit to your GitHub portfolio in real time.</p>
    <div class="badges">
      <div class="b-item">⚡ Instant Sync</div>
      <div class="b-item">🛡️ Anti-Duplicate Filter</div>
      <div class="b-item">📁 Auto Problem README</div>
      <div class="b-item">🔒 100% Client-Side</div>
    </div>
  </div>
  <div class="right-preview">
    <div class="box-hdr">
      <span class="box-verdict">✓ Accepted &bull; 91% Beats</span>
      <span style="font-size:12px; color:#f59e0b; font-weight:600;">Two Sum</span>
    </div>
    <div class="box-repo">
      📂 leetcode/two-sum/solution.py<br>
      📄 leetcode/two-sum/README.md
    </div>
    <div style="font-size:13px; color:#10b981; font-weight:600;">
      ✓ Successfully committed to main branch
    </div>
  </div>
</body></html>`;

console.log('Rendering Chrome Web Store graphics in JPEG (.jpg) and 24-bit PNG formats...');

const chromeUploadDir = path.resolve(__dirname, '../chrome-store-upload');

// 1. Render JPEGs (Universal standard, strictly 24-bit NO ALPHA)
renderHtmlToImage(screenshot1Html, path.join(storeAssetsDir, 'screenshot-1-auto-sync.jpg'), 1280, 800);
renderHtmlToImage(screenshot2Html, path.join(storeAssetsDir, 'screenshot-2-popup.jpg'), 1280, 800);
renderHtmlToImage(screenshot3Html, path.join(storeAssetsDir, 'screenshot-3-github-repo.jpg'), 1280, 800);

// 2. Render PNGs (24-bit RGB)
renderHtmlToImage(screenshot1Html, path.join(storeAssetsDir, 'screenshot-1-auto-sync.png'), 1280, 800);
renderHtmlToImage(screenshot2Html, path.join(storeAssetsDir, 'screenshot-2-popup.png'), 1280, 800);
renderHtmlToImage(screenshot3Html, path.join(storeAssetsDir, 'screenshot-3-github-repo.png'), 1280, 800);

// 3. Render Promo tiles in both JPG and PNG
renderHtmlToImage(promoSmallHtml, path.join(storeAssetsDir, 'promo-small-440x280.jpg'), 440, 280);
renderHtmlToImage(promoSmallHtml, path.join(storeAssetsDir, 'promo-small-440x280.png'), 440, 280);

renderHtmlToImage(promoMarqueeHtml, path.join(storeAssetsDir, 'promo-marquee-1400x560.jpg'), 1400, 560);
renderHtmlToImage(promoMarqueeHtml, path.join(storeAssetsDir, 'promo-marquee-1400x560.png'), 1400, 560);

// 4. Copy all assets directly to chrome-store-upload
const assetsToCopy = [
  'screenshot-1-auto-sync.jpg',
  'screenshot-2-popup.jpg',
  'screenshot-3-github-repo.jpg',
  'screenshot-1-auto-sync.png',
  'screenshot-2-popup.png',
  'screenshot-3-github-repo.png',
  'promo-small-440x280.jpg',
  'promo-small-440x280.png',
  'promo-marquee-1400x560.jpg',
  'promo-marquee-1400x560.png'
];

assetsToCopy.forEach(f => {
  fs.copyFileSync(path.join(storeAssetsDir, f), path.join(chromeUploadDir, f));
});

console.log('All store assets (JPEG and PNG) generated and copied to chrome-store-upload successfully!');
