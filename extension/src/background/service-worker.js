/**
 * LeetPush Service Worker (Manifest V3 Background Script)
 * Self-contained direct GitHub synchronization engine.
 * Runs automatically with browser start - ZERO local server or terminal commands required!
 */

const DEFAULT_SETTINGS = {
  repoUrl: "https://github.com/RIKKY-J/LeetPush.git",
  owner: "RIKKY-J",
  repo: "LeetPush",
  branch: "main",
  baseDir: "leetcode",
  githubToken: "",
  autoPush: true,
  acceptedOnly: true,
  includeReadme: true,
  showNotifications: true
};

/**
 * Initializes default settings on install or browser startup
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[LeetPush Background] Installed / Updated:", details.reason);
  const existing = await getStoredSettings();
  const merged = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.local.set({ settings: merged });
});

/**
 * Helper to get settings from storage
 */
async function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (res) => {
      resolve(res.settings || DEFAULT_SETTINGS);
    });
  });
}

/**
 * Parses GitHub repository URL into { owner, repo }
 */
function parseGitHubUrl(input) {
  if (!input) return null;
  let cleaned = input.trim();
  cleaned = cleaned.replace(/\.git\/?$/, "").replace(/\/+$/, "");
  const match = cleaned.match(/(?:github\.com[\/:])?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

/**
 * Message listener
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PUSH_SUBMISSION") {
    handleDirectPush(request.submission)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "VERIFY_GITHUB_CONNECTION") {
    verifyGitHub(request.config)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "GET_STATUS") {
    getStatus()
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/**
 * Main Direct Push Implementation (Directly to GitHub REST API)
 */
async function handleDirectPush(submission) {
  const settings = await getStoredSettings();

  const token = settings.githubToken ? settings.githubToken.trim() : "";
  const owner = settings.owner || "RIKKY-J";
  const repo = settings.repo || "LeetPush";
  const branch = settings.branch || "main";
  const baseDir = (settings.baseDir || "leetcode").replace(/^\/+|\/+$/g, "");

  if (!token) {
    throw new Error("GitHub Personal Access Token is missing. Click the LeetPush extension icon to add your token.");
  }
  if (!owner || !repo) {
    throw new Error("GitHub Repository is not configured. Click the LeetPush extension icon to set your repository URL.");
  }

  const slug = (submission.problem.slug || "solution").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const ext = getLanguageExtension(submission.language);
  const path = baseDir ? `${baseDir}/${slug}/solution.${ext}` : `${slug}/solution.${ext}`;

  // 1. Check if the solution file already exists to get its SHA
  let existingSha = null;
  const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  const getRes = await fetch(getFileUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "LeetPush-Chrome-Extension"
    }
  });

  if (getRes.status === 200) {
    const fileData = await getRes.json();
    existingSha = fileData.sha;
  } else if (getRes.status === 401) {
    throw new Error("GitHub token is invalid or expired. Please update it in the extension popup.");
  } else if (getRes.status === 404) {
    // 404 is normal when file does not exist yet
    existingSha = null;
  } else if (getRes.status === 403) {
    throw new Error("GitHub rate limit reached or token lacks 'repo' write permissions.");
  }

  // 2. Commit the solution code to main branch
  const commitMsg = `leetcode: add ${slug} (${submission.language})${
    submission.runtime ? ` [${submission.runtime}]` : ""
  }`;

  // Encode UTF-8 to Base64 safely
  const base64Code = btoa(unescape(encodeURIComponent(submission.code)));

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const putPayload = {
    message: commitMsg,
    content: base64Code,
    branch
  };
  if (existingSha) {
    putPayload.sha = existingSha;
  }

  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "LeetPush-Chrome-Extension"
    },
    body: JSON.stringify(putPayload)
  });

  const putData = await putRes.json();
  if (!putRes.ok) {
    throw new Error(putData.message || `Failed to commit solution (HTTP ${putRes.status})`);
  }

  const action = existingSha ? "update" : "create";
  const result = {
    success: true,
    action,
    path,
    fileUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${path}`,
    commitUrl: putData.commit?.html_url
  };

  // 3. Optional: Create or update problem README.md
  if (settings.includeReadme !== false && submission.problem.description) {
    try {
      await commitProblemReadme({
        owner,
        repo,
        branch,
        baseDir,
        slug,
        title: submission.problem.title,
        difficulty: submission.problem.difficulty,
        description: submission.problem.description,
        token
      });
    } catch (readmeErr) {
      console.warn("[LeetPush] Could not create problem README (non-critical):", readmeErr.message);
    }
  }

  // Record sync history and notify
  await recordSuccessfulSync(submission, result, { owner, repo, branch, showNotifications: settings.showNotifications });
  return result;
}

/**
 * Commits or updates problem README.md alongside solution
 */
async function commitProblemReadme({ owner, repo, branch, baseDir, slug, title, difficulty, description, token }) {
  const readmePath = baseDir ? `${baseDir}/${slug}/README.md` : `${slug}/README.md`;

  // Check if README exists
  let readmeSha = null;
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${readmePath}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "LeetPush-Chrome-Extension"
    }
  });

  if (checkRes.status === 200) {
    const data = await checkRes.json();
    readmeSha = data.sha;
  }

  const diffColor = difficulty === "Easy" ? "brightgreen" : difficulty === "Medium" ? "orange" : "red";
  const badge = difficulty ? `![Difficulty: ${difficulty}](https://img.shields.io/badge/Difficulty-${encodeURIComponent(difficulty)}-${diffColor})\n\n` : "";

  const content = `# ${title || slug}\n\n${badge}` +
    `**LeetCode Problem**: [View on LeetCode](https://leetcode.com/problems/${slug}/)\n\n` +
    `## Description\n\n${description}\n\n` +
    `---\n*Auto-synced with [LeetPush](https://github.com/RIKKY-J/LeetPush)*`;

  const payload = {
    message: `leetcode: doc ${slug} README`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch
  };
  if (readmeSha) payload.sha = readmeSha;

  await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${readmePath}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "LeetPush-Chrome-Extension"
    },
    body: JSON.stringify(payload)
  });
}

/**
 * Verifies token and repo access with GitHub API
 */
async function verifyGitHub(config = {}) {
  const settings = await getStoredSettings();
  const token = (config.token || settings.githubToken || "").trim();
  const owner = config.owner || settings.owner;
  const repo = config.repo || settings.repo;

  if (!token) {
    return { success: false, error: "Please enter your GitHub Personal Access Token." };
  }

  try {
    let username = null;
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LeetPush-Chrome-Extension"
        }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        username = userData.login;
      }
    } catch (e) {
      // Fine-grained tokens may restrict /user endpoint
    }

    // 2. Verify repository write access
    if (owner && repo) {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LeetPush-Chrome-Extension"
        }
      });

      if (!repoRes.ok) {
        if (repoRes.status === 404) {
          return {
            success: false,
            username,
            error: `Repository '${owner}/${repo}' was not found. Please ensure the repository exists on GitHub.`
          };
        }
        if (repoRes.status === 403) {
          return {
            success: false,
            username,
            error: `Your token does not have write permission for '${owner}/${repo}'. Please ensure 'repo' scope is selected.`
          };
        }
        return { success: false, username, error: `Could not access repo '${owner}/${repo}' (HTTP ${repoRes.status})` };
      }

      const repoData = await repoRes.json();
      const hasPushAccess = repoData.permissions ? repoData.permissions.push : true;

      if (!hasPushAccess) {
        return {
          success: false,
          username,
          error: `Authenticated as @${username}, but you do not have push/write permission to '${owner}/${repo}'.`
        };
      }

      return {
        success: true,
        username,
        repo: repoData.full_name,
        defaultBranch: repoData.default_branch || "main"
      };
    }

    return { success: true, username };
  } catch (err) {
    return { success: false, error: err.message || "Network error communicating with GitHub API." };
  }
}

/**
 * Returns extension status for popup
 */
async function getStatus() {
  const settings = await getStoredSettings();
  const token = settings.githubToken ? settings.githubToken.trim() : "";
  const isConfigured = Boolean(token && settings.owner && settings.repo);

  return {
    isConfigured,
    owner: settings.owner,
    repo: settings.repo,
    repoUrl: settings.repoUrl || `https://github.com/${settings.owner}/${settings.repo}`,
    branch: settings.branch || "main",
    hasToken: Boolean(token)
  };
}

/**
 * Records successful push in storage and triggers notification
 */
async function recordSuccessfulSync(submission, result, { owner, repo, branch, showNotifications }) {
  const syncRecord = {
    id: Date.now().toString(),
    title: submission.problem.title || submission.problem.slug,
    slug: submission.problem.slug,
    language: submission.language,
    path: result.path,
    fileUrl: result.fileUrl,
    commitUrl: result.commitUrl,
    action: result.action,
    timestamp: new Date().toISOString()
  };

  await chrome.storage.local.set({ last_submission: syncRecord });

  chrome.storage.local.get(["sync_history"], (data) => {
    const history = data.sync_history || [];
    history.unshift(syncRecord);
    if (history.length > 50) history.pop();
    chrome.storage.local.set({ sync_history: history });
  });

  if (showNotifications !== false) {
    const probName = submission.problem.title || submission.problem.slug;
    chrome.notifications.create(`leetpush-${Date.now()}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "LeetPush — Pushed to GitHub!",
      message: `✅ ${probName} (${submission.language}) pushed to ${owner}/${repo} (${branch})`
    });
  }
}

function getLanguageExtension(language) {
  if (!language) return "txt";
  const map = {
    python: "py", python3: "py", cpp: "cpp", "c++": "cpp", c: "c", java: "java",
    javascript: "js", js: "js", typescript: "ts", ts: "ts", go: "go", rust: "rs",
    kotlin: "kt", swift: "swift", csharp: "cs", php: "php", ruby: "rb",
    scala: "scala", dart: "dart", mysql: "sql", postgresql: "sql", bash: "sh"
  };
  return map[language.toLowerCase().trim()] || "txt";
}
