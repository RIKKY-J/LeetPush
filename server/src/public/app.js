document.addEventListener("DOMContentLoaded", () => {
  const serverStatusPill = document.getElementById("server-status-pill");
  const serverStatusText = document.getElementById("server-status-text");
  const authSubLabel = document.getElementById("auth-sub-label");
  const githubAuthStatus = document.getElementById("github-auth-status");
  const githubUser = document.getElementById("github-user");
  const githubRepo = document.getElementById("github-repo");
  const githubBranch = document.getElementById("github-branch");
  const githubBaseDir = document.getElementById("github-base-dir");
  const syncCountStat = document.getElementById("sync-count-stat");
  const historyTableBody = document.getElementById("history-table-body");

  const refreshBtn = document.getElementById("refresh-btn");
  const testConnectionBtn = document.getElementById("test-connection-btn");
  const sendTestPushBtn = document.getElementById("send-test-push-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const toast = document.getElementById("toast");

  function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }

  async function checkHealthAndConfig() {
    try {
      const [healthRes, configRes] = await Promise.all([
        fetch("/health").then(r => r.json()),
        fetch("/api/config").then(r => r.json())
      ]);

      serverStatusText.textContent = "Server Active";
      githubRepo.textContent = `${configRes.owner || "(not set)"}/${configRes.repo || "(not set)"}`;
      githubBranch.textContent = configRes.branch || "main";
      githubBaseDir.textContent = configRes.baseDir || "leetcode";

      if (configRes.tokenConfigured) {
        githubAuthStatus.innerHTML = `<span class="text-success">● Token Configured (${configRes.tokenPreview})</span>`;
        authSubLabel.textContent = "Token detected in environment";
      } else {
        githubAuthStatus.innerHTML = `<span class="text-error">● No Token Configured</span>`;
        authSubLabel.textContent = "Set GITHUB_TOKEN in server/.env";
      }
    } catch (err) {
      serverStatusText.textContent = "Server Offline";
      serverStatusPill.style.borderColor = "var(--accent-red)";
      serverStatusPill.style.color = "var(--accent-red)";
      showToast("Could not communicate with local server", "error");
    }
  }

  async function testGitHubConnection() {
    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = "Testing Access...";

    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (data.authenticated) {
        githubUser.textContent = data.username || "Authenticated";
        if (data.repoAccessible) {
          showToast(`Connected successfully as ${data.username}! Repo accessible.`, "success");
          githubAuthStatus.innerHTML = `<span class="text-success">● Verified &amp; Repo Accessible</span>`;
        } else {
          showToast(`Authenticated as ${data.username}, but check repo permissions: ${data.error}`, "error");
          githubAuthStatus.innerHTML = `<span class="text-error">● Repo Not Found / No Write Access</span>`;
        }
      } else {
        showToast(`GitHub Authentication failed: ${data.error}`, "error");
        githubAuthStatus.innerHTML = `<span class="text-error">● Authentication Failed</span>`;
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      testConnectionBtn.disabled = false;
      testConnectionBtn.textContent = "Test GitHub Access";
    }
  }

  async function sendTestPush() {
    sendTestPushBtn.disabled = true;
    sendTestPushBtn.textContent = "Pushing Test Solution...";

    const testPayload = {
      problem: {
        title: "Two Sum",
        slug: "two-sum",
        id: "1",
        difficulty: "Easy",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
      },
      language: "python3",
      code: "# LeetPush Test Solution\nclass Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []\n",
      runtime: "48ms",
      memory: "17.4MB"
    };

    try {
      const res = await fetch("/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Pushed ${testPayload.problem.title} (${data.action})!`, "success");
        await loadHistory();
      } else {
        showToast(`Push failed: ${data.error}`, "error");
      }
    } catch (err) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      sendTestPushBtn.disabled = false;
      sendTestPushBtn.textContent = "Trigger Test Push";
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      syncCountStat.textContent = data.total || 0;

      if (!data.history || data.history.length === 0) {
        historyTableBody.innerHTML = `
          <tr class="empty-row">
            <td colspan="6">
              <div class="empty-state">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No pushes recorded yet. Submit a problem on LeetCode or run a test push!</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      historyTableBody.innerHTML = data.history.map(item => {
        const timeAgo = formatTimeAgo(new Date(item.timestamp));
        const badgeClass = item.action === "create" ? "badge-create" : "badge-update";
        
        return `
          <tr>
            <td><strong>${escapeHtml(item.problemTitle)}</strong></td>
            <td><span class="badge badge-lang">${escapeHtml(item.language)}</span></td>
            <td><span class="badge ${badgeClass}">${item.action || "success"}</span></td>
            <td><code class="value code">${escapeHtml(item.path || "—")}</code></td>
            <td style="color: var(--text-dim);">${timeAgo}</td>
            <td>
              ${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">View File</a>` : "—"}
            </td>
          </tr>
        `;
      }).join("");
    } catch (err) {
      console.warn("Failed to load history:", err);
    }
  }

  async function clearHistory() {
    if (!confirm("Are you sure you want to clear sync history?")) return;
    try {
      await fetch("/api/history", { method: "DELETE" });
      showToast("History cleared", "info");
      await loadHistory();
    } catch (err) {
      showToast("Failed to clear history", "error");
    }
  }

  function formatTimeAgo(date) {
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  refreshBtn.addEventListener("click", () => {
    checkHealthAndConfig();
    loadHistory();
    showToast("Dashboard refreshed", "info");
  });

  testConnectionBtn.addEventListener("click", testGitHubConnection);
  sendTestPushBtn.addEventListener("click", sendTestPush);
  clearHistoryBtn.addEventListener("click", clearHistory);

  // Initialize
  checkHealthAndConfig();
  loadHistory();
});
