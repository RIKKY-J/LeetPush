document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("settings-form");
  const repoUrlInput = document.getElementById("repoUrl");
  const branchInput = document.getElementById("branch");
  const baseDirInput = document.getElementById("baseDir");
  const githubTokenInput = document.getElementById("githubToken");
  const autoPushCheck = document.getElementById("autoPush");
  const includeReadmeCheck = document.getElementById("includeReadme");
  const showNotificationsCheck = document.getElementById("showNotifications");
  const testConnectionBtn = document.getElementById("test-connection-btn");
  const statusMessage = document.getElementById("status-message");

  function parseGitHubInput(input) {
    if (!input) return null;
    let cleaned = input.trim();
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

  function showMessage(text, type = "success") {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
    setTimeout(() => {
      if (type === "success") {
        statusMessage.className = "status-message";
      }
    }, 6000);
  }

  // Load existing settings
  chrome.storage.local.get(["settings"], (res) => {
    const s = res.settings || {};
    repoUrlInput.value = s.repoUrl || (s.owner && s.repo ? `https://github.com/${s.owner}/${s.repo}` : "https://github.com/RIKKY-J/LeetPush.git");
    branchInput.value = s.branch || "main";
    baseDirInput.value = s.baseDir || "leetcode";
    githubTokenInput.value = s.githubToken || "";
    autoPushCheck.checked = s.autoPush !== false;
    includeReadmeCheck.checked = s.includeReadme !== false;
    showNotificationsCheck.checked = s.showNotifications !== false;
  });

  // Save Settings
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rawUrl = repoUrlInput.value.trim();
    const parsed = parseGitHubInput(rawUrl);

    if (!parsed) {
      showMessage("Invalid GitHub repository link. Format should be 'https://github.com/username/repo' or 'username/repo'.", "error");
      return;
    }

    const newSettings = {
      owner: parsed.owner,
      repo: parsed.repo,
      repoUrl: rawUrl,
      branch: branchInput.value.trim() || "main",
      baseDir: baseDirInput.value.trim() || "leetcode",
      githubToken: githubTokenInput.value.trim(),
      autoPush: autoPushCheck.checked,
      acceptedOnly: true,
      includeReadme: includeReadmeCheck.checked,
      showNotifications: showNotificationsCheck.checked
    };

    await chrome.storage.local.set({ settings: newSettings });
    showMessage(`✓ Settings saved! Connected to ${parsed.owner}/${parsed.repo} (branch: ${newSettings.branch}).`, "success");
  });

  // Test Connection
  testConnectionBtn.addEventListener("click", async () => {
    const rawUrl = repoUrlInput.value.trim();
    const token = githubTokenInput.value.trim();
    const parsed = parseGitHubInput(rawUrl);

    if (!parsed) {
      showMessage("Please enter a valid GitHub repository URL first.", "error");
      return;
    }

    if (!token) {
      showMessage("Please enter your GitHub Personal Access Token to test connection.", "error");
      return;
    }

    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = "Testing...";

    chrome.runtime.sendMessage(
      {
        action: "VERIFY_GITHUB_CONNECTION",
        config: {
          token,
          owner: parsed.owner,
          repo: parsed.repo
        }
      },
      (res) => {
        testConnectionBtn.disabled = false;
        testConnectionBtn.textContent = "Test Connection";

        if (res && res.success) {
          showMessage(
            `✓ Successfully connected as @${res.username}! Repository '${parsed.owner}/${parsed.repo}' is accessible and ready to push to main.`,
            "success"
          );
        } else {
          showMessage(`Connection failed: ${res?.error || "Unknown error"}`, "error");
        }
      }
    );
  });
});
