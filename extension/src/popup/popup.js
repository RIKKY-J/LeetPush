document.addEventListener("DOMContentLoaded", async () => {
  const statusPill = document.getElementById("status-pill");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");

  const repoDisplay = document.getElementById("repo-display");
  const repoLink = document.getElementById("repo-link");
  const branchDisplay = document.getElementById("branch-display");
  const bridgeDisplay = document.getElementById("bridge-display");

  const submissionEmpty = document.getElementById("submission-empty");
  const submissionContent = document.getElementById("submission-content");
  const subTitle = document.getElementById("sub-title");
  const subLang = document.getElementById("sub-lang");
  const subTime = document.getElementById("sub-time");
  const subPath = document.getElementById("sub-path");
  const subViewBtn = document.getElementById("sub-view-btn");

  const openGithubBtn = document.getElementById("open-github-btn");
  const openSettingsBtn = document.getElementById("open-settings-btn");
  const syncCurrentTabBtn = document.getElementById("sync-current-tab-btn");

  // Load stored settings and last submission
  chrome.storage.local.get(["settings", "last_submission"], async (data) => {
    const settings = data.settings || {
      owner: "RIKKY-J",
      repo: "LeetPush",
      branch: "main",
      syncMode: "companion"
    };

    const targetRepo = `${settings.owner || "RIKKY-J"}/${settings.repo || "LeetPush"}`;
    repoDisplay.textContent = targetRepo;
    repoLink.href = `https://github.com/${targetRepo}`;
    branchDisplay.textContent = settings.branch || "main";
    bridgeDisplay.textContent = settings.syncMode === "direct" ? "Direct GitHub API" : "Companion Server";

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

    // Check health
    if (settings.syncMode === "companion") {
      checkCompanionStatus(settings.serverUrl);
    } else {
      setConnectedStatus("Direct Mode Active");
    }
  });

  function checkCompanionStatus(serverUrl) {
    chrome.runtime.sendMessage({ action: "CHECK_SERVER_STATUS", serverUrl }, (response) => {
      if (response && response.online) {
        setConnectedStatus("Connected");
      } else {
        setOfflineStatus("Server Offline");
      }
    });
  }

  function setConnectedStatus(text) {
    statusDot.className = "status-dot pulsing";
    statusDot.style.backgroundColor = "var(--accent-green)";
    statusPill.style.color = "#34d399";
    statusPill.style.borderColor = "rgba(16, 185, 129, 0.3)";
    statusText.textContent = text;
  }

  function setOfflineStatus(text) {
    statusDot.className = "status-dot";
    statusDot.style.backgroundColor = "var(--accent-red)";
    statusPill.style.color = "#f87171";
    statusPill.style.borderColor = "rgba(239, 68, 68, 0.3)";
    statusText.textContent = text;
  }

  function formatTimeAgo(date) {
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (isNaN(diffSec) || diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  openGithubBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: repoLink.href });
  });

  openSettingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  syncCurrentTabBtn.addEventListener("click", async () => {
    syncCurrentTabBtn.disabled = true;
    syncCurrentTabBtn.textContent = "Syncing Active Tab...";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) {
        alert("Please navigate to an open LeetCode problem tab to push the current solution.");
        syncCurrentTabBtn.disabled = false;
        syncCurrentTabBtn.textContent = "⚡ Push Active Problem";
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "TRIGGER_CURRENT_PAGE_PUSH" }, (res) => {
        syncCurrentTabBtn.disabled = false;
        syncCurrentTabBtn.textContent = "⚡ Push Active Problem";
        if (chrome.runtime.lastError) {
          alert("Could not reach LeetCode tab. Refresh the LeetCode page and try again.");
        } else if (res && !res.success) {
          alert(`Sync failed: ${res.error}`);
        } else {
          window.close();
        }
      });
    });
  });
});
