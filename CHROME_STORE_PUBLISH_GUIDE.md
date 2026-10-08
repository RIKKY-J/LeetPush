# 🚀 Chrome Web Store Publishing Guide for LeetPush

This guide provides copy-paste content and instructions to publish **LeetPush** to the Google Chrome Web Store.

---

## 📦 Prepared Package & Assets Summary

All files are verified and prepared in this repository:

| Asset | Location / Filename | Purpose |
| :--- | :--- | :--- |
| **Extension ZIP** | [`leetpush-extension.zip`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/leetpush-extension.zip) | Verified Manifest V3 archive with root structure and forward slashes. |
| **Store Icon (128x128)** | [`store-assets/icon-128.png`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/store-assets/icon-128.png) | High-res store listing icon (PNG). |
| **Screenshot 1 (1280x800)** | [`store-assets/screenshot-1-auto-sync.png`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/store-assets/screenshot-1-auto-sync.png) | In-action preview showing Accepted verdict & instant push. |
| **Screenshot 2 (1280x800)** | [`store-assets/screenshot-2-popup.png`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/store-assets/screenshot-2-popup.png) | Extension popup UI with connected GitHub repo. |
| **Screenshot 3 (1280x800)** | [`store-assets/screenshot-3-github-repo.png`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/store-assets/screenshot-3-github-repo.png) | Clean organized repository folder structure & README preview. |
| **Small Promo (440x280)** | [`store-assets/promo-small-440x280.png`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/store-assets/promo-small-440x280.png) | Small promotional tile card for store listings. |
| **Marquee Promo (1400x560)**| [`store-assets/promo-marquee-1400x560.png`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/store-assets/promo-marquee-1400x560.png) | Large marquee header for featured placement. |
| **Privacy Policy** | [`PRIVACY_POLICY.md`](file:///c:/Users/RIKKY/Desktop/Updated_version/LeetPush/PRIVACY_POLICY.md) | Official privacy policy ready to link on GitHub. |

---

## Step 1: Register Developer Account

1. Navigate to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account.
3. Accept the Chrome Web Store Developer Agreement.
4. Pay the **one-time $5 USD** developer registration fee.
5. Enable 2-Step Verification on your Google Account (mandatory for CWS developers).

---

## Step 2: Upload Your ZIP Package

1. In the Chrome Developer Dashboard, click **Add new item** in the top right.
2. Drag and drop or upload:
   ```text
   leetpush-extension.zip
   ```
3. The dashboard will validate `manifest.json`.

---

## Step 3: Store Listing Tab (Copy & Paste Details)

### 1. Product Details
- **Name:**
  ```text
  LeetPush — LeetCode to GitHub Auto-Pusher
  ```
- **Summary (Short Description - max 132 chars):**
  ```text
  Automatically sync accepted LeetCode submissions directly to your GitHub repository with zero friction.
  ```

### 2. Detailed Description
Copy and paste this formatted text into the **Description** box:

```markdown
🚀 LeetPush — Automatically Sync LeetCode Solutions to GitHub with Zero Friction!

Stop manually copying and pasting your solutions after solving LeetCode problems. LeetPush bridges your daily algorithm practice with your developer portfolio on GitHub. The instant you get an "Accepted" verdict, LeetPush extracts the exact submitted code and commits it directly to your GitHub repository.

⚡ KEY FEATURES

• 🚀 Instant Automatic Push: Submissions are synchronized the moment LeetCode confirms an "Accepted" status.
• 🎯 Dual-Tier Code Extraction: Intercepts network responses to guarantee the exact submitted code is captured (rather than unsaved draft editor edits).
• 🛡️ Anti-Duplicate Fingerprinting: Uses cryptographic SHA-256 hashes (slug + language + code) so repeated submissions or duplicate clicks never pollute your Git commit log.
• 📁 Clean Multi-Language Portfolio: Automatically organizes solutions into clean directories with problem folders, multi-language solutions, and optional formatted problem READMEs with difficulty badges.
• 🌐 18+ Supported Languages: Python (2/3), C++, Java, JavaScript, TypeScript, Go, Rust, C, Kotlin, Swift, C#, PHP, Ruby, Scala, Dart, SQL, Bash, and more.
• 🔒 100% Client-Side & Private: Runs completely in your browser. Your Personal Access Token stays strictly inside Chrome's private local storage. No middleman servers or third-party tracking.
• 🎛️ Minimalist Modern UI: Includes a floating in-page status pill on LeetCode, a fast popup dashboard, and customizable options.

🛠️ SUPER SIMPLE 60-SECOND SETUP

1. Install LeetPush and click the extension icon in your Chrome toolbar.
2. Enter your GitHub repository address (e.g., username/leetcode-practice).
3. Paste your GitHub Personal Access Token (requires 'repo' scope).
4. Solve any problem on LeetCode — once Accepted, your code is live on GitHub!

🔒 PRIVACY & SECURITY FIRST

• Zero Telemetry & Analytics: We do not track, collect, or store any of your data.
• Direct GitHub Communication: All requests travel securely from your browser directly to api.github.com.
• Open Source: Fully transparent code available on GitHub.

Open source repository: https://github.com/RIKKY-J/LeetPush
```

### 3. Category & Language
- **Category:** `Developer Tools` (or `Productivity`)
- **Language:** `English`

---

## Step 4: Graphic Assets Upload

Navigate to the **Graphic Assets** section in the Store Listing:

1. **Store Icon:**
   - Upload: `store-assets/icon-128.png` (128 × 128 px)
2. **Screenshots (At least 1 required, 1280 × 800 px):**
   - Upload: `store-assets/screenshot-1-auto-sync.png`
   - Upload: `store-assets/screenshot-2-popup.png`
   - Upload: `store-assets/screenshot-3-github-repo.png`
3. **Promotional Tiles (Recommended for store feature):**
   - Small promo tile (440 × 280 px): Upload `store-assets/promo-small-440x280.png`
   - Marquee promo tile (1400 × 560 px): Upload `store-assets/promo-marquee-1400x560.png`

---

## Step 5: Privacy Practices Tab (Crucial for Fast Approval)

Google reviewers strictly evaluate the **Privacy practices** tab. Use these exact declarations:

### 1. Single Purpose Description
> "Automatically synchronizes accepted LeetCode problem solutions and formatted problem descriptions directly to the user's personal GitHub repository."

### 2. Permission Justifications
Google will ask you to justify each permission declared in `manifest.json`. Copy and paste:

- **`storage`:**
  > "Used to save the user's target GitHub repository name, target branch, and personal access token locally within Chrome's private storage."

- **`notifications`:**
  > "Used to display an unobtrusive desktop notification when a solution is successfully pushed to GitHub or if an authentication error occurs."

- **Host Permission: `https://leetcode.com/*` and `https://leetcode.cn/*`:**
  > "Required to detect when a problem solution receives an 'Accepted' verdict and extract the submitted code on LeetCode problem pages."

- **Host Permission: `https://api.github.com/*`:**
  > "Required to commit and push solution files and problem README markdown directly to the user's configured GitHub repository."

### 3. Data Usage Disclosures
- **Do you collect user data?** Select **No** (The extension processes data strictly client-side).
- If prompted about data types:
  - Personally identifiable information: **No**
  - Financial info: **No**
  - Authentication info: Select **No** (Access token is stored strictly in `chrome.storage.local` on the client and never sent to developer servers).
- Check all developer certifications:
  - [x] *"I certify that this item complies with the Limited Use policy."*
  - [x] *"I certify that this item does not sell user data."*
  - [x] *"I certify that this item does not use or transfer user data for purposes unrelated to the item's single purpose."*
  - [x] *"I certify that this item does not use or transfer user data to determine creditworthiness or for lending purposes."*

### 4. Privacy Policy URL
Enter the URL to your hosted privacy policy:
```text
https://github.com/RIKKY-J/LeetPush/blob/main/PRIVACY_POLICY.md
```
*(Make sure this file is committed and pushed to your GitHub repository).*

---

## Step 6: Reviewer Guidance (Notes for Google Review Team)

In the **Account > Notes for reviewer** or testing instructions section, provide this note:

```text
Testing Instructions:
1. LeetPush operates entirely client-side without third-party servers.
2. To test the extension:
   - Click the LeetPush extension icon in the toolbar.
   - Enter any public or private GitHub repository address (e.g. 'username/repo') and a GitHub Personal Access Token with 'repo' scope.
   - Alternatively, clicking 'Test Connection' in the extension Settings validates the GitHub API connection.
   - Navigate to any problem on leetcode.com (e.g., https://leetcode.com/problems/two-sum/).
   - When a solution is submitted and accepted, the extension captures the code and pushes it to the configured repository.
```

---

## Step 7: Submit for Review

1. Click **Submit for Review**.
2. If this is your first submission, select **Publish automatically once approved**.
3. Reviews typically take **12 to 48 hours**. Once approved, your extension will be live for millions of users on the Chrome Web Store!

---

## 🆓 Free Distribution Alternatives (No $5 Fee)

If you prefer not to pay the $5 Google registration fee, you can distribute LeetPush immediately via these free methods:

### Option A: Microsoft Edge Add-ons (Free & Reach Chrome Users)
- **Partner Center Registration:** 100% **FREE** (no registration fee).
- Edge uses the Chromium engine, so Chrome extensions work without modification.
- Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview), upload `leetpush-extension.zip`, and publish.
- Chrome users can install Edge extensions by clicking "Allow extensions from other stores".

### Option B: Firefox Add-ons (AMO - Free)
- Firefox Developer Hub registration is 100% **FREE**.
- WebExtensions API is supported.
- Submit to [addons.mozilla.org](https://addons.mozilla.org/developers/).

### Option C: GitHub Releases (Direct Unpacked / CRX)
- Tag a release on GitHub (e.g., `v1.0.0`) and attach `leetpush-extension.zip`.
- Users download the ZIP, extract it, go to `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
