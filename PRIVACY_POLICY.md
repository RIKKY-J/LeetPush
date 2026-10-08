# Privacy Policy for LeetPush

**Effective Date:** October 7, 2026  
**Last Updated:** October 7, 2026  

This Privacy Policy explains how **LeetPush** ("we", "our", or "the Extension") handles user data and privacy.

---

## 1. Single Purpose & Philosophy

LeetPush is an open-source productivity tool designed with a single purpose:  
**To automatically synchronize accepted LeetCode problem solutions directly to the user's personal GitHub repository.**

We believe in complete privacy and user data sovereignty. LeetPush operates **100% locally and client-side** inside your Google Chrome browser.

---

## 2. Information We Handle

### A. Information Stored Locally on Your Device
LeetPush only stores configuration settings that you explicitly provide, using Chrome's secure local storage API (`chrome.storage.local`):
- **GitHub Target Repository:** The repository path (e.g., `username/repository`) and branch name.
- **GitHub Personal Access Token:** Stored in your private local browser storage to authenticate Git commit requests directly with the official GitHub API (`api.github.com`).
- **Submission Preferences:** Settings such as auto-push toggle, README generation preference, and notification settings.
- **Deduplication Fingerprints:** Cryptographic SHA-256 hashes of recent submissions (consisting of problem slug, language, and code) to prevent duplicate commits.

### B. Information We Do NOT Collect
- **No Personal Identifiable Information (PII):** We do not collect names, email addresses, IP addresses, or location data.
- **No Third-Party Analytics or Trackers:** LeetPush contains **zero** analytics scripts, tracking pixels, cookies, or telemetry libraries.
- **No External Servers or Relays:** We do not own, operate, or maintain any intermediate proxy servers. All communication takes place directly between your browser and `leetcode.com` / `api.github.com`.
- **No Sale or Sharing of Data:** We never sell, transfer, rent, or monetize user data under any circumstance.

---

## 3. Chrome Permissions & Why They Are Needed

| Permission | Purpose & Justification |
| :--- | :--- |
| `storage` | Required to store your target GitHub repository, branch settings, and GitHub access token locally in your browser. |
| `notifications` | Required to display an unobtrusive desktop notification when your solution has been successfully pushed to GitHub or if a push fails. |
| `https://leetcode.com/*`<br>`https://leetcode.cn/*` | Required to detect accepted problem submissions on LeetCode and extract the submitted solution code. |
| `https://api.github.com/*` | Required to communicate directly with GitHub's REST API to commit solution files and formatted problem READMEs to your chosen repository. |

---

## 4. Third-Party Services

When using LeetPush, your browser communicates directly with:
- **LeetCode** (`leetcode.com`, `leetcode.cn`): Subject to [LeetCode's Privacy Policy](https://leetcode.com/privacy/).
- **GitHub** (`api.github.com`): Subject to [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

LeetPush does not share your credentials with any other third party.

---

## 5. Data Retention & Deletion

All data saved by LeetPush resides strictly within your local Chrome profile.
You can delete all stored tokens and configuration data at any time by:
1. Clearing settings in the LeetPush popup or options page, OR
2. Removing the LeetPush extension from `chrome://extensions`.

Uninstalling the extension immediately purges all stored tokens and settings from your device.

---

## 6. Open Source Transparency

LeetPush is open-source software licensed under the MIT License. You can inspect the source code, verify privacy claims, or contribute at:  
[https://github.com/RIKKY-J/LeetPush](https://github.com/RIKKY-J/LeetPush)

---

## 7. Contact & Support

If you have any questions or feedback regarding this Privacy Policy, please open an issue on GitHub:  
[https://github.com/RIKKY-J/LeetPush/issues](https://github.com/RIKKY-J/LeetPush/issues)
