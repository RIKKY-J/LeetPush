document.addEventListener("DOMContentLoaded", async () => {
  const statusPill = document.getElementById("status-pill");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");

  const repoUrlInput = document.getElementById("repo-url-input");
  const githubTokenInput = document.getElementById("github-token-input");
  const saveConnectBtn = document.getElementById("save-connect-btn");
  const feedbackMessage = document.getElementById("feedback-message");

  const submissionEmpty = document.getElementById("submission-empty");
  const submissionContent = document.getElementById("submission-content");
  const subTitle = document.getElementById("sub-title");
  const subLang = document.getElementById("sub-lang");
  const subTime = document.getElementById("sub-time");
  const subPath = document.getElementById("sub-path");
  const subViewBtn = document.getElementById("sub-view-btn");

  const syncCurrentTabBtn = document.getElementById("sync-current-tab-btn");
  const openGithubLink = document.getElementById("open-github-link");
  const openOptionsLink = document.getElementById("open-options-link");

  /**
   * Intelligently parses GitHub URL into owner and repo
   */
  function parseGitHubInput(input) {
    if (!input) return null;
    let cleaned = input.trim();
    // Strip protocol and domain if present
    cleaned = cleaned.replace(/^https?:\/\//, "").replace(/^www\./, "");
    cleaned = cleaned.replace(/^github\.com\//, "");
    cleaned = cleaned.replace(/\.git\/?$/, "");
    cleaned = cleaned.replace(/\/+$/, "");

    const parts = cleaned.split("/");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  }

  function showFeedback(text, type = "success") {
    feedbackMessage.textContent = text;
    feedbackMessage.className = `feedback-message ${type}`;
    setTimeout(() => {
      if (type === "success") {
        feedbackMessage.className = "feedback-message";
      }
    }, 6000);
  }

  function setConnectedUI(owner, repo) {
    statusDot.className = "status-dot pulsing";
    statusDot.style.backgroundColor = "var(--accent-green)";
    statusPill.style.color = "#34d399";
    statusPill.style.borderColor = "rgba(16, 185, 129, 0.3)";
    statusText.textContent = `Connected (${repo})`;
    openGithubLink.href = `https://github.com/${owner}/${repo}`;
  }

  function setSetupNeededUI(message = "Setup Needed") {
    statusDot.className = "status-dot";
    statusDot.style.backgroundColor = "var(--accent-red)";
    statusPill.style.color = "#f87171";
    statusPill.style.borderColor = "rgba(239, 68, 68, 0.3)";
    statusText.textContent = message;
  }

  // 1. Load stored settings and last submission
  chrome.storage.local.get(["settings", "last_submission"], (data) => {
    const s = data.settings || {};
    
    // Populate repository address input
    if (s.owner && s.repo) {
      repoUrlInput.value = `${s.owner}/${s.repo}`;
      openGithubLink.href = `https://github.com/${s.owner}/${s.repo}`;
    } else if (s.repoUrl) {
      const parsed = parseGitHubInput(s.repoUrl);
      repoUrlInput.value = parsed ? `${parsed.owner}/${parsed.repo}` : s.repoUrl;
    }

    // Populate token if stored
    if (s.githubToken) {
      githubTokenInput.value = s.githubToken;
      setConnectedUI(s.owner || "RIKKY-J", s.repo || "LeetPush");
    } else {
      setSetupNeededUI("Token Missing");
    }

    // Last submission card
    if (data.last_submission) {
      const sub = data.last_submission;
      submissionEmpty.style.display = "none";
      submissionContent.style.display = "block";
      subTitle.textContent = sub.title || sub.slug || "Recent Submission";
      subLang.textContent = sub.language || "code";
      subTime.textContent = formatTimeAgo(new Date(sub.timestamp));
      subPath.textContent = sub.path || "";
      if (sub.fileUrl) {
        subViewBtn.href = sub.fileUrl;
        subViewBtn.style.display = "inline-block";
      } else {
        subViewBtn.style.display = "none";
      }
    } else {
      submissionEmpty.style.display = "block";
      submissionContent.style.display = "none";
    }
  });

  // 2. Save & Connect Action
  saveConnectBtn.addEventListener("click", async () => {
    const rawRepo = repoUrlInput.value.trim();
    const token = githubTokenInput.value.trim();

    if (!rawRepo) {
      showFeedback("Please enter your GitHub repository link.", "error");
      return;
    }

    const parsed = parseGitHubInput(rawRepo);
    if (!parsed) {
      showFeedback("Invalid format. Use 'username/repository' or 'https://github.com/user/repo'.", "error");
      return;
    }

    if (!token) {
      showFeedback("Please paste your GitHub Personal Access Token.", "error");
      return;
    }

    saveConnectBtn.disabled = true;
    saveConnectBtn.innerHTML = `<span>Verifying GitHub Access...</span>`;

    chrome.runtime.sendMessage(
      {
        action: "VERIFY_GITHUB_CONNECTION",
        config: {
          token,
          owner: parsed.owner,
          repo: parsed.repo
        }
      },
      async (res) => {
        saveConnectBtn.disabled = false;
        saveConnectBtn.innerHTML = `<span>Connect &amp; Save</span>`;

        if (res && res.success) {
          // Save valid settings
          const currentSettings = await new Promise(r => chrome.storage.local.get(["settings"], d => r(d.settings || {})));
          const updated = {
            ...currentSettings,
            owner: parsed.owner,
            repo: parsed.repo,
            repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
            branch: "main",
            githubToken: token
          };

          await chrome.storage.local.set({ settings: updated });

          setConnectedUI(parsed.owner, parsed.repo);
          showFeedback(`✓ Connected to ${parsed.owner}/${parsed.repo}! Ready to auto-sync to main.`, "success");
        } else {
          setSetupNeededUI("Auth Error");
          showFeedback(`Connection failed: ${res?.error || "Check token and repo name"}`, "error");
        }
      }
    );
  });

  // 3. Sync Active LeetCode Tab
  syncCurrentTabBtn.addEventListener("click", async () => {
    syncCurrentTabBtn.disabled = true;
    syncCurrentTabBtn.textContent = "Syncing Active Tab...";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) {
        alert("Please navigate to an open LeetCode problem tab to push the current solution.");
        syncCurrentTabBtn.disabled = false;
        syncCurrentTabBtn.textContent = "⚡ Push Active LeetCode Problem";
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "TRIGGER_CURRENT_PAGE_PUSH" }, (res) => {
        syncCurrentTabBtn.disabled = false;
        syncCurrentTabBtn.textContent = "⚡ Push Active LeetCode Problem";
        if (chrome.runtime.lastError) {
          alert("Could not communicate with the LeetCode tab. Refresh the LeetCode page and try again.");
        } else if (res && !res.success) {
          alert(`Sync failed: ${res.error}`);
        } else {
          window.close();
        }
      });
    });
  });

  openOptionsLink.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  function formatTimeAgo(date) {
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (isNaN(diffSec) || diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  }
});
