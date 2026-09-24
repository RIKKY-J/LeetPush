# 🚀 LeetPush — LeetCode to GitHub Auto-Pusher

<div align="center">

![LeetPush Banner](https://img.shields.io/badge/LeetPush-Chrome%20Extension-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-10b981?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![GitHub REST API](https://img.shields.io/badge/GitHub-REST%20API-181717?style=for-the-badge&logo=github&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Seamlessly and automatically synchronize your accepted LeetCode submissions directly to your GitHub repository.**

[Quick Start](#-quick-start) • [Architecture](#-architecture) • [Features](#-key-features) • [Configuration](#-configuration) • [Dashboard](#-companion-dashboard)

</div>

---

## 📌 Overview

**LeetPush** bridges your LeetCode problem-solving practice with your GitHub portfolio. When you solve a problem and receive an **Accepted** verdict, LeetPush automatically extracts the exact submitted solution, generates clean repository paths, creates optional problem READMEs, and commits the code directly to your GitHub repository.

---

## ✨ Key Features

- ⚡ **Instant Automatic Push**: Submissions are synchronized the moment LeetCode confirms an **Accepted** status.
- 🎯 **Accurate Code Extraction**: Uses dual-tier detection (network response interception + DOM Monaco fallback) to capture the exact submitted code instead of draft editor changes.
- 🛡️ **Anti-Duplicate Fingerprinting**: Computes SHA-256 hashes (`slug + language + code`) so duplicate submissions or repeated button clicks never pollute your Git commit history.
- 📁 **Organized Repository Structure**: Automatically organizes solutions into clean, multi-language directories:
  ```text
  leetcode/
  ├── two-sum/
  │   ├── README.md        # Problem description & difficulty badge
  │   └── solution.py      # Python solution
  └── valid-parentheses/
      ├── README.md
      ├── solution.cpp     # C++ solution
      └── solution.java    # Java solution
  ```
- 🌐 **Supported Languages**: Python (2/3), C++, Java, JavaScript, TypeScript, Go, Rust, C, Kotlin, Swift, C#, PHP, Ruby, Scala, Dart, SQL, Bash, and more.
- 🔒 **Secure Companion Architecture**: Keeps your GitHub Personal Access Token isolated on localhost inside `server/.env`, preventing sensitive tokens from ever being exposed to browser scripts.
- 🎛️ **Direct Mode Fallback**: Also supports standalone Direct GitHub API mode without running the local server if desired.
- 🎨 **Modern Glassmorphic UI**: Includes an in-page floating widget on LeetCode, an extension popup, an options dashboard, and a local web status monitor on `http://localhost:3000`.

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   LEETCODE PROBLEM                     │
│               User submits solution code               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             LEETPUSH CHROME EXTENSION (MV3)            │
│  ├─ Page Interceptor: Captures exact accepted response │
│  ├─ Submission Provider: Normalizes title, slug, code  │
│  ├─ Duplicate Filter: SHA-256 fingerprint verification │
│  └─ In-Page UI Overlay: Live status pill on LeetCode   │
└───────────────────────────┬────────────────────────────┘
                            │
               POST http://localhost:3000/push
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            LOCAL NODE.JS COMPANION SERVER              │
│  ├─ Express REST API & CORS Middleware                 │
│  ├─ Secure .env token storage (never leaks to client)  │
│  ├─ GitHub Contents API (Octokit integration)          │
│  └─ Companion Web Dashboard on http://localhost:3000   │
└───────────────────────────┬────────────────────────────┘
                            │
                       GitHub API
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 YOUR GITHUB REPOSITORY                 │
│  leetcode/two-sum/solution.py                          │
│  leetcode/two-sum/README.md                            │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Super Simple 2-Minute Setup (Zero Localhost Needed!)

LeetPush runs **100% self-contained directly inside Google Chrome**. It starts automatically whenever your browser opens — **no terminal commands, no localhost server, and no background processes required!**

### Step 1: Load Extension into Chrome

1. Open Chrome and go to `chrome://extensions` in the address bar.
2. In the top-right corner, toggle **Developer mode** to **ON**.
3. In the top-left, click **Load unpacked**.
4. Select the `LeetPush/extension` folder (or extract `leetpush-extension.zip`).

### Step 2: Paste Your GitHub Link & Token

1. Click the **LeetPush** icon in your Chrome toolbar.
2. **GitHub Repository Address**: Simply paste your repository link:
   ```text
   https://github.com/RIKKY-J/LeetPush.git
   ```
   *(Or just `RIKKY-J/LeetPush`)*
3. **Personal Access Token**: Click **"🔑 Generate Token ↗"** (pre-checks the `repo` permission), generate your token, and paste it into the field.
4. Click **"Connect & Save"**.

That's all! You will see:
`✓ Connected to RIKKY-J/LeetPush! Ready to auto-sync to main.`

---

### Step 3: Solve Problems on LeetCode!

1. Open any problem on [LeetCode](https://leetcode.com/problems/).
2. Submit your solution.
3. Once LeetCode marks it **Accepted**, LeetPush immediately pushes the solution directly to the `main` branch of your GitHub repository!

---

### 🖥️ Optional Companion Server Mode

If you prefer running a dedicated local Node.js server bridge, the companion server is still included in `server/`:
```bash
cd server
npm install
npm start
```
Visit `http://localhost:3000` to view the companion web dashboard.

---

### 4. Solve Problems on LeetCode!

1. Open any problem on [LeetCode](https://leetcode.com/problems/).
2. You will see the **LeetPush: Ready** badge at the bottom-right corner.
3. Write and submit your code.
4. Once LeetCode marks it **Accepted**, LeetPush immediately pushes the solution to GitHub!

---

## ⚙️ Configuration Options

Open the LeetPush extension popup and click **Settings** (or right-click extension icon > *Options*):

| Option | Default | Description |
| :--- | :--- | :--- |
| **Sync Mode** | `Companion Server` | Choose Companion Server (Recommended) or Standalone Direct GitHub API. |
| **Companion URL** | `http://localhost:3000` | Port / host of your local companion bridge. |
| **GitHub Owner** | `RIKKY-J` | Your GitHub account or organization name. |
| **Repository** | `LeetPush` | Target repository name. |
| **Branch** | `main` | Target Git branch. |
| **Base Directory** | `leetcode` | Root directory inside repository for solutions. |
| **Auto-Push** | `true` | Automatically push upon accepted submission. |
| **Accepted Only**| `true` | Only push successful solutions. |
| **Problem README**| `true` | Automatically generate a formatted problem description README. |
| **Notifications**| `true` | Show desktop notification on completion. |

---

## 📊 Companion Dashboard

The companion server includes a dashboard at `http://localhost:3000`:

- **Live Server & GitHub Health**: Verifies authentication, repository permissions, and connection latency.
- **One-Click Test Push**: Verifies that your GitHub token has write access to your repository with a sample solution.
- **Sync History**: Displays recent pushes, file paths, and direct GitHub links.
- **Quick Setup Guide**: Step-by-step instructions for quick onboarding.

---

## 🧪 Testing

Run the automated test suite to verify server endpoints, path generation, and language mappings:

```bash
npm run test:server
```

---

## 🛡️ Security

- **Token Safety**: The GitHub Personal Access Token is stored in `server/.env`, which is ignored by `.gitignore`. It is never bundled into extension files or sent to external servers.
- **No Analytics / Telemetry**: LeetPush does not track, collect, or transmit any user information or telemetry.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
