/**
 * LeetPush Service Worker (Manifest V3 Background Script)
 * Manages GitHub synchronization, companion server communication, storage, and notifications.
 */

const DEFAULT_SETTINGS = {
  syncMode: "companion", // "companion" | "direct"
  serverUrl: "http://localhost:3000",
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
 * Initializes default settings on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[LeetPush Background] Extension installed/updated:", details.reason);
  const existing = await getStoredSettings();
  const merged = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.local.set({ settings: merged });
});

/**
 * Retrieves configured settings
 */
async function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (res) => {
      resolve(res.settings || DEFAULT_SETTINGS);
    });
  });
}

/**
 * Main message router
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PUSH_SUBMISSION") {
    handlePushSubmission(request.submission)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "CHECK_SERVER_STATUS") {
    checkServerHealth(request.serverUrl)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ online: false, error: err.message }));
    return true;
  }

  if (request.action === "TEST_DIRECT_GITHUB") {
    testDirectGitHub(request.config)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/**
 * Pushes submission through Companion Server or direct GitHub API
 */
async function handlePushSubmission(submission) {
  const settings = await getStoredSettings();

  if (settings.syncMode === "direct") {
    return await pushDirectToGitHub(submission, settings);
  } else {
    return await pushViaCompanionServer(submission, settings);
  }
}

/**
 * Approach 1: Push via Companion Node.js Server
 */
async function pushViaCompanionServer(submission, settings) {
  const serverUrl = (settings.serverUrl || "http://localhost:3000").replace(/\/+$/, "");

  try {
    const payload = {
      problem: submission.problem,
      language: submission.language,
      code: submission.code,
      runtime: submission.runtime,
      memory: submission.memory,
      config: {
        owner: settings.owner,
        repo: settings.repo,
        branch: settings.branch,
        baseDir: settings.baseDir,
        includeReadme: settings.includeReadme
      }
    };

    const res = await fetch(`${serverUrl}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.success) {
      await recordSuccessfulSync(submission, data, settings);
      return data;
    } else {
      throw new Error(data.error || `Server responded with HTTP ${res.status}`);
    }
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error(
        `Local GitHub companion service isn't running on ${serverUrl}. Start the server with 'npm run server' and try again.`
      );
    }
    throw err;
  }
}

/**
 * Approach 2: Direct GitHub API fallback (if user opts for direct token mode)
 */
async function pushDirectToGitHub(submission, settings) {
  const token = settings.githubToken;
  const owner = settings.owner;
  const repo = settings.repo;
  const branch = settings.branch || "main";
  const baseDir = (settings.baseDir || "leetcode").replace(/^\/+|\/+$/g, "");

  if (!token) {
    throw new Error("GitHub token is not configured in LeetPush Direct Mode.");
  }
  if (!owner || !repo) {
    throw new Error("GitHub owner or repository name is missing in settings.");
  }

  // Get extension for language
  const ext = getDirectFileExtension(submission.language);
  const slug = (submission.problem.slug || "solution").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const path = baseDir ? `${baseDir}/${slug}/solution.${ext}` : `${slug}/solution.${ext}`;

  // Check if file exists
  let sha = null;
  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const getRes = await fetch(getUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json"
    }
  });

  if (getRes.status === 200) {
    const existingFile = await getRes.json();
    sha = existingFile.sha;
  }

  const commitMsg = `leetcode: add ${slug} (${submission.language})${
    submission.runtime ? ` [${submission.runtime}]` : ""
  }`;

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const putBody = {
    message: commitMsg,
    content: btoa(unescape(encodeURIComponent(submission.code))),
    branch
  };
  if (sha) putBody.sha = sha;

  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(putBody)
  });

  const putData = await putRes.json();
  if (!putRes.ok) {
    throw new Error(putData.message || `GitHub API error (${putRes.status})`);
  }

  const result = {
    success: true,
    action: sha ? "update" : "create",
    path,
    fileUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${path}`,
    commitUrl: putData.commit?.html_url
  };

  await recordSuccessfulSync(submission, result, settings);
  return result;
}

/**
 * Records successful push in extension storage and triggers notification
 */
async function recordSuccessfulSync(submission, result, settings) {
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

  // Update last submission
  await chrome.storage.local.set({ last_submission: syncRecord });

  // Update history in storage
  chrome.storage.local.get(["sync_history"], (data) => {
    const history = data.sync_history || [];
    history.unshift(syncRecord);
    if (history.length > 50) history.pop();
    chrome.storage.local.set({ sync_history: history });
  });

  // Show desktop notification if enabled
  if (settings.showNotifications !== false) {
    const title = submission.problem.title || submission.problem.slug;
    chrome.notifications.create(`leetpush-sync-${Date.now()}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "LeetPush — Pushed to GitHub",
      message: `✅ ${title} (${submission.language}) pushed to ${settings.owner}/${settings.repo}`
    });
  }
}

/**
 * Checks Companion Server health
 */
async function checkServerHealth(customUrl) {
  const settings = await getStoredSettings();
  const url = (customUrl || settings.serverUrl || "http://localhost:3000").replace(/\/+$/, "");

  try {
    const res = await fetch(`${url}/health`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      return { online: true, data };
    }
    return { online: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Test Direct GitHub Token & Repo
 */
async function testDirectGitHub({ token, owner, repo }) {
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (!userRes.ok) {
      return { success: false, error: "Invalid GitHub personal access token." };
    }

    const userData = await userRes.json();

    if (owner && repo) {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (!repoRes.ok) {
        return {
          success: false,
          error: `Token authenticated as '${userData.login}', but cannot access repository '${owner}/${repo}'.`
        };
      }
    }

    return { success: true, username: userData.login };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getDirectFileExtension(language) {
  if (!language) return "txt";
  const map = {
    python: "py", python3: "py", cpp: "cpp", "c++": "cpp", c: "c", java: "java",
    javascript: "js", js: "js", typescript: "ts", ts: "ts", go: "go", rust: "rs",
    kotlin: "kt", swift: "swift", csharp: "cs", php: "php", ruby: "rb"
  };
  return map[language.toLowerCase().trim()] || "txt";
}
