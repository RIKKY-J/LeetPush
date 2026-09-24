document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("settings-form");
  const modeCompanion = document.getElementById("mode-companion");
  const modeDirect = document.getElementById("mode-direct");
  const companionConfigGroup = document.getElementById("companion-config-group");
  const directTokenGroup = document.getElementById("direct-token-group");
  const serverUrlInput = document.getElementById("serverUrl");
  const githubTokenInput = document.getElementById("githubToken");
  const ownerInput = document.getElementById("owner");
  const repoInput = document.getElementById("repo");
  const branchInput = document.getElementById("branch");
  const baseDirInput = document.getElementById("baseDir");
  const autoPushCheck = document.getElementById("autoPush");
  const acceptedOnlyCheck = document.getElementById("acceptedOnly");
  const includeReadmeCheck = document.getElementById("includeReadme");
  const showNotificationsCheck = document.getElementById("showNotifications");
  const testConnectionBtn = document.getElementById("test-connection-btn");
  const statusMessage = document.getElementById("status-message");
  const modeBadge = document.getElementById("mode-badge");

  // Load existing settings
  chrome.storage.local.get(["settings"], (res) => {
    const s = res.settings || {};
    if (s.syncMode === "direct") {
      modeDirect.checked = true;
      updateModeUI("direct");
    } else {
      modeCompanion.checked = true;
      updateModeUI("companion");
    }

    serverUrlInput.value = s.serverUrl || "http://localhost:3000";
    githubTokenInput.value = s.githubToken || "";
    ownerInput.value = s.owner || "RIKKY-J";
    repoInput.value = s.repo || "LeetPush";
    branchInput.value = s.branch || "main";
    baseDirInput.value = s.baseDir || "leetcode";

    autoPushCheck.checked = s.autoPush !== false;
    acceptedOnlyCheck.checked = s.acceptedOnly !== false;
    includeReadmeCheck.checked = s.includeReadme !== false;
    showNotificationsCheck.checked = s.showNotifications !== false;
  });

  function updateModeUI(mode) {
    if (mode === "direct") {
      companionConfigGroup.style.display = "none";
      directTokenGroup.style.display = "flex";
      modeBadge.textContent = "Direct API Mode";
      modeBadge.style.color = "#38bdf8";
      modeBadge.style.borderColor = "rgba(56, 189, 248, 0.3)";
    } else {
      companionConfigGroup.style.display = "flex";
      directTokenGroup.style.display = "none";
      modeBadge.textContent = "Companion Mode";
      modeBadge.style.color = "#a5b4fc";
      modeBadge.style.borderColor = "rgba(99, 102, 241, 0.3)";
    }
  }

  modeCompanion.addEventListener("change", () => updateModeUI("companion"));
  modeDirect.addEventListener("change", () => updateModeUI("direct"));

  function showMessage(text, type = "success") {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
    setTimeout(() => {
      statusMessage.className = "status-message";
    }, 5000);
  }

  // Save Settings
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newSettings = {
      syncMode: modeDirect.checked ? "direct" : "companion",
      serverUrl: serverUrlInput.value.trim().replace(/\/+$/, ""),
      githubToken: githubTokenInput.value.trim(),
      owner: ownerInput.value.trim(),
      repo: repoInput.value.trim(),
      branch: branchInput.value.trim() || "main",
      baseDir: baseDirInput.value.trim() || "leetcode",
      autoPush: autoPushCheck.checked,
      acceptedOnly: acceptedOnlyCheck.checked,
      includeReadme: includeReadmeCheck.checked,
      showNotifications: showNotificationsCheck.checked
    };

    await chrome.storage.local.set({ settings: newSettings });
    showMessage("Settings saved successfully!", "success");
  });

  // Test Connection
  testConnectionBtn.addEventListener("click", async () => {
    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = "Testing...";

    const mode = modeDirect.checked ? "direct" : "companion";

    if (mode === "companion") {
      const serverUrl = serverUrlInput.value.trim().replace(/\/+$/, "");
      chrome.runtime.sendMessage(
        { action: "CHECK_SERVER_STATUS", serverUrl },
        (res) => {
          testConnectionBtn.disabled = false;
          testConnectionBtn.textContent = "Test Connection";
          if (res && res.online) {
            showMessage(
              `Companion Server is active on ${serverUrl}! (Target: ${ownerInput.value}/${repoInput.value})`,
              "success"
            );
          } else {
            showMessage(
              `Could not reach companion server on ${serverUrl}. Is 'npm run server' running?`,
              "error"
            );
          }
        }
      );
    } else {
      const token = githubTokenInput.value.trim();
      const owner = ownerInput.value.trim();
      const repo = repoInput.value.trim();

      if (!token) {
        testConnectionBtn.disabled = false;
        testConnectionBtn.textContent = "Test Connection";
        showMessage("Please provide a GitHub Personal Access Token to test.", "error");
        return;
      }

      chrome.runtime.sendMessage(
        { action: "TEST_DIRECT_GITHUB", config: { token, owner, repo } },
        (res) => {
          testConnectionBtn.disabled = false;
          testConnectionBtn.textContent = "Test Connection";
          if (res && res.success) {
            showMessage(
              `Successfully authenticated as @${res.username}! Repository '${owner}/${repo}' is accessible.`,
              "success"
            );
          } else {
            showMessage(`Connection failed: ${res?.error || "Unknown error"}`, "error");
          }
        }
      );
    }
  });
});
