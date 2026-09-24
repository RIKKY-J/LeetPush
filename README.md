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

## 🚀 Quick Start

### 1. Clone & Setup Repository

```bash
git clone https://github.com/RIKKY-J/LeetPush.git
cd LeetPush
```

### 2. Configure & Start Companion Server

```bash
# Navigate to server directory and install dependencies
cd server
npm install

# Copy example environment configuration
cp .env.example .env
```

Open `server/.env` in your text editor and fill in your GitHub details:

```env
PORT=3000
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_OWNER=your-github-username
GITHUB_REPO=LeetPush
GITHUB_BRANCH=main
GITHUB_BASE_DIR=leetcode
```

> **How to create a GitHub Token**:
> 1. Visit [GitHub Token Settings](https://github.com/settings/tokens).
> 2. Generate a **Personal Access Token (Classic)** with the `repo` scope (or a fine-grained token with *Contents: Read & Write* permission).

Start the companion server:

```bash
npm start
# Or for live auto-reload during development:
npm run dev
```

Visit **`http://localhost:3000`** in your browser to verify the companion dashboard is running!

---

### 3. Load Extension in Google Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked** (top-left).
4. Select the `LeetPush/extension` directory from your computer.
5. The **LeetPush** icon will appear in your Chrome toolbar!

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
