# LeetCode → GitHub Auto-Pusher — Development Plan

## Project: LeetCode → GitHub Auto-Pusher

This project is a Chrome extension that automatically pushes a user's accepted LeetCode submissions to a configured GitHub repository.

The recommended architecture uses:

- Chrome Extension (Manifest V3)
- A small local Node.js companion service
- GitHub REST API
- Chrome Storage API

---

## 1. What it should do

When a user successfully submits a LeetCode problem:

1. Detect the successful submission.
2. Read:
   - Problem title
   - Problem slug/ID
   - Language
   - Submitted code
   - Submission status
3. Generate a sensible GitHub path.
4. Commit the solution to the configured GitHub repository.
5. Show a small success/failure notification.

Example repository:

```text
leetcode/
├── two-sum/
│   └── solution.py
├── valid-parentheses/
│   └── solution.cpp
└── reverse-linked-list/
    └── solution.java
```

Example notification:

```text
✅ Two Sum pushed to GitHub
```

---

## 2. Recommended architecture

```text
┌─────────────────────┐
│      LeetCode       │
│                     │
│  Submit Solution    │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│   Chrome Extension       │
│                          │
│  Content Script          │
│  ├─ Detect submission    │
│  ├─ Extract metadata     │
│  └─ Extract code         │
│                          │
│  Service Worker          │
│  └─ Manage communication │
└────────────┬─────────────┘
             │
             │ localhost
             ▼
┌──────────────────────────┐
│ Local GitHub Service     │
│       Node.js            │
│                          │
│  ├─ Store GitHub token   │
│  ├─ Authenticate GitHub  │
│  ├─ Create/update file   │
│  └─ Commit changes       │
└────────────┬─────────────┘
             │
             │ GitHub API
             ▼
┌──────────────────────────┐
│         GitHub           │
│                          │
│   Your repository        │
└──────────────────────────┘
```

The extension should handle LeetCode-side interaction, while the local Node.js service handles GitHub authentication and repository operations.

---

## 3. Tech stack

### Chrome extension

- Manifest V3
- JavaScript or TypeScript
- Content Scripts
- Service Worker
- Chrome Storage API
- Extension Options/Popup

### Backend

- Node.js
- Express
- GitHub REST API
- `dotenv`

### Optional

- TypeScript
- Vite
- GitHub OAuth/device flow later

For the first version, keep the stack simple.

---

## 4. Extension structure

Recommended structure:

```text
leetcode-github-sync/
│
├── extension/
│   ├── manifest.json
│   │
│   ├── src/
│   │   ├── content/
│   │   │   └── leetcode.js
│   │   │
│   │   ├── background/
│   │   │   └── service-worker.js
│   │   │
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.js
│   │   │   └── popup.css
│   │   │
│   │   └── options/
│   │       ├── options.html
│   │       └── options.js
│   │
│   └── icons/
│
├── server/
│   ├── src/
│   │   ├── server.js
│   │   ├── github.js
│   │   └── routes.js
│   │
│   ├── .env
│   ├── package.json
│   └── .gitignore
│
├── README.md
└── package.json
```

---

## 5. The most difficult part: detecting the submission

Do not design the extension around a single LeetCode DOM selector because LeetCode can change its frontend.

Use a combination of:

### A. Observe the page

Use a `MutationObserver` to detect relevant changes:

```javascript
const observer = new MutationObserver(() => {
    checkSubmissionStatus();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
```

### B. Identify successful submission

Look for the submission result becoming something equivalent to:

```text
Accepted
```

Then trigger extraction.

However, do not assume that simply seeing the word "Accepted" is enough. Associate the event with the current problem and submission.

---

## 6. Getting the problem information

The URL provides a useful starting point.

Example:

```text
https://leetcode.com/problems/two-sum/
```

Extract the slug:

```javascript
const match = location.pathname.match(
    /\/problems\/([^/]+)/
);

const slug = match?.[1];
```

Result:

```text
two-sum
```

The title can then be obtained separately.

The normalized internal object should look like:

```javascript
{
    slug: "two-sum",
    title: "Two Sum",
    language: "python3",
    code: "...",
    status: "Accepted"
}
```

---

## 7. Getting the submitted code

This requires special attention.

### Approach A — Read the editor

The extension reads the code currently displayed in the editor.

Advantage:

- Easy to implement.

Problem:

```text
User writes code
       ↓
Submit
       ↓
Accepted
       ↓
User changes code
       ↓
Extension reads editor
```

The extension could push code that was not actually submitted.

### Approach B — Retrieve the actual submission

Prefer this approach.

After detecting an accepted submission:

```text
Accepted
   ↓
identify submission
   ↓
retrieve submission
   ↓
get submitted code
   ↓
push that exact code
```

This makes the GitHub repository represent the actual submitted solution.

---

## 8. Internal data model

Create a standard submission object before doing anything with GitHub:

```javascript
const submission = {
    problem: {
        title: "Two Sum",
        slug: "two-sum"
    },

    language: "python3",

    code: `
class Solution:
    def twoSum(self, nums, target):
        ...
    `,

    status: "Accepted",

    submittedAt: new Date().toISOString()
};
```

Everything downstream should work from this object.

This separates LeetCode extraction from GitHub functionality.

---

## 9. Language → file extension

Create a language mapping:

```javascript
const extensions = {
    python: "py",
    python3: "py",
    cpp: "cpp",
    c: "c",
    java: "java",
    javascript: "js",
    typescript: "ts",
    go: "go",
    rust: "rs",
    kotlin: "kt",
    swift: "swift",
    csharp: "cs",
    php: "php",
    ruby: "rb"
};
```

Then:

```javascript
const extension = extensions[submission.language];
```

---

## 10. Generate the GitHub path

Recommended structure:

```text
leetcode/{slug}/solution.{extension}
```

Example:

```text
leetcode/two-sum/solution.py
```

If the same problem is solved in multiple languages:

```text
leetcode/two-sum/
├── solution.py
└── solution.cpp
```

This avoids overwriting solutions in different languages.

---

## 11. GitHub service API

The extension can send the normalized submission to a local endpoint:

```http
POST http://localhost:3000/push
```

Request body:

```json
{
  "problem": {
    "title": "Two Sum",
    "slug": "two-sum"
  },
  "language": "python3",
  "code": "class Solution:\n    ..."
}
```

The local server handles GitHub operations.

---

## 12. Server logic

Conceptually:

```javascript
app.post("/push", async (req, res) => {
    const submission = req.body;

    const path = generatePath(submission);

    const result = await pushToGithub({
        path,
        content: submission.code,
        message: `Add solution for ${submission.problem.title}`
    });

    res.json(result);
});
```

The server should:

1. Validate the request.
2. Generate the repository path.
3. Check whether the file exists.
4. Create or update the file.
5. Commit the change.
6. Return a structured result.

---

## 13. GitHub API flow

The GitHub operation should follow this flow:

```text
Receive submission
       ↓
Generate file path
       ↓
Check whether file exists
       ↓
If doesn't exist
    ↓
    create file

If exists
    ↓
    update file
       ↓
Commit
       ↓
Return success
```

GitHub's repository contents API can be used to create/update repository files.

Conceptually:

```text
PUT /repos/{owner}/{repo}/contents/{path}
```

Request:

```json
{
    "message": "Add solution for Two Sum",
    "content": "<base64 encoded code>"
}
```

When updating an existing file, include the current blob/file SHA as required by the API.

---

## 14. Configuration UI

The extension should have an Options page.

Suggested UI:

```text
┌────────────────────────────────────┐
│       LeetCode GitHub Sync         │
├────────────────────────────────────┤
│                                    │
│ GitHub Repository                  │
│ [ username/leetcode-solutions    ] │
│                                    │
│ Branch                             │
│ [ main                           ] │
│                                    │
│ Directory                          │
│ [ leetcode                       ] │
│                                    │
│ ☑ Push only Accepted submissions  │
│ ☑ Automatically push               │
│ ☐ Include problem description      │
│                                    │
│        [ Save Settings ]           │
└────────────────────────────────────┘
```

Recommended settings:

- Repository
- Branch
- Root directory
- Auto-push
- Accepted-only
- Optional problem description

---

## 15. Extension popup

Suggested popup:

```text
┌─────────────────────────────┐
│ LeetCode → GitHub           │
├─────────────────────────────┤
│                             │
│ 🟢 Connected                │
│                             │
│ Repository                  │
│ github.com/user/leetcode    │
│                             │
│ Last submission             │
│ Two Sum                     │
│ Python                      │
│                             │
│ ✅ Pushed 2 minutes ago     │
│                             │
│ [ Open GitHub ]             │
│ [ Settings ]                │
└─────────────────────────────┘
```

The popup should primarily provide status and quick actions, not become a full dashboard.

---

## 16. Prevent duplicate pushes

Avoid creating multiple commits for the same submission.

Generate a fingerprint from:

```text
slug + language + code
```

For example:

```javascript
const fingerprint = await sha256(
    `${slug}:${language}:${code}`
);
```

Store the fingerprint in:

```text
chrome.storage.local
```

Flow:

```text
fingerprint already exists?
       │
   ┌───┴───┐
   │       │
  YES      NO
   │       │
ignore    push
           │
           ↓
        save hash
```

This prevents duplicate submissions caused by repeated clicks or UI events.

---

## 17. Commit message

Recommended format:

```text
leetcode: add {slug} ({language})
```

Example:

```text
leetcode: add two-sum (python3)
```

This keeps the Git history easy to scan.

---

## 18. README generation

A later feature could automatically maintain:

```text
leetcode/
README.md
```

Example:

```markdown
# LeetCode Solutions

| Problem | Difficulty | Language |
|---------|------------|----------|
| Two Sum | Easy | Python |
| Valid Parentheses | Easy | C++ |
| Binary Search | Easy | Java |
```

Do not implement this in V1. First prove that automatic submission syncing works.

---

## 19. V1 development roadmap

Build the project incrementally.

### Phase 1 — GitHub connection

Ignore LeetCode initially.

Build:

```text
Chrome Extension
      ↓
localhost server
      ↓
GitHub
```

Test:

> Click a button → create `test.py` in GitHub.

Do not move on until this works reliably.

### Phase 2 — Manual submission

Add a button:

```text
Push current solution
```

The extension sends:

```javascript
{
    slug,
    language,
    code
}
```

### Phase 3 — Detect Accepted

Add:

```text
Submit
  ↓
Accepted detected
  ↓
extract submission
```

Then automatically call the local server.

### Phase 4 — Duplicate protection

Add SHA-256 fingerprints.

### Phase 5 — Configuration

Add:

- Repository
- Branch
- Directory
- Auto-push toggle
- Accepted-only toggle

### Phase 6 — Polish

Add:

- Notifications
- GitHub link
- Last push status
- Error messages
- Retry
- Offline handling
- Logs

---

## 20. Error handling

Never silently fail.

### GitHub unavailable

```text
⚠️ Couldn't connect to GitHub.

Your solution wasn't pushed.

[Retry]
```

### Authentication failure

```text
🔐 GitHub authentication failed.

Check your GitHub configuration.
```

### Duplicate

```text
ℹ️ This solution is already in GitHub.
```

### Successful

```text
✅ Two Sum pushed to GitHub
```

---

## 21. Important security decision

Do not implement:

```text
Extension
   ↓
GitHub token embedded in JS
   ↓
GitHub
```

Instead:

```text
Extension
   ↓
localhost
   ↓
GitHub token
   ↓
GitHub
```

Example `.env`:

```env
GITHUB_TOKEN=...
GITHUB_OWNER=...
GITHUB_REPO=leetcode-solutions
GITHUB_BRANCH=main
```

Make sure `.env` is included in `.gitignore`.

The token should never be committed to GitHub or bundled into the extension.

---

## 22. One potential problem with the architecture

LeetCode's frontend and API behavior can change.

Do not make the entire system depend on one undocumented endpoint or one CSS selector.

Use an abstraction:

```javascript
class LeetCodeSubmissionProvider {
    async getCurrentProblem() {}
    async getSubmission() {}
    async getSubmissionStatus() {}
}
```

Then:

```text
LeetCode UI
     ↓
SubmissionProvider
     ↓
Normalized Submission
     ↓
GitHubService
```

If LeetCode changes its frontend later, only the provider layer should need significant changes.

---

## 23. Final architecture

```text
                    LEETCODE
                       │
                       │ submit
                       ▼
              ┌─────────────────┐
              │ Content Script   │
              │                 │
              │ Detect Accepted │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Submission      │
              │ Provider        │
              └────────┬────────┘
                       │
                       ▼
             ┌──────────────────┐
             │ Normalized       │
             │ Submission       │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Duplicate Check  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Chrome Service   │
             │ Worker           │
             └────────┬─────────┘
                      │
                 localhost
                      │
                      ▼
             ┌──────────────────┐
             │ Node.js Server   │
             │                  │
             │ GitHub Service   │
             └────────┬─────────┘
                      │
                 GitHub API
                      │
                      ▼
             ┌──────────────────┐
             │ GitHub Repository│
             │                  │
             │ leetcode/        │
             │ ├─ two-sum/      │
             │ │  └─ solution.py│
             │ └─ ...           │
             └──────────────────┘
```

---

# UI Design for the Final Product

The architecture diagram above represents the internal system. The user should experience it as a simple Chrome extension rather than seeing the technical pipeline.

## A. LeetCode page

The extension should add a small status indicator near the existing LeetCode submission interface.

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│ LeetCode                                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Two Sum                                      Easy            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ class Solution:                                        │  │
│  │     def twoSum(self, nums, target):                    │  │
│  │         ...                                            │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│                       [ Submit ]                              │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │ 🟢 GitHub Sync: Ready                       │            │
│  └──────────────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

After an accepted submission:

```text
┌──────────────────────────────────────────────┐
│ ✅ Accepted                                  │
│                                              │
│ GitHub Sync                                  │
│                                              │
│ ⬆ Pushing solution...                        │
└──────────────────────────────────────────────┘
```

Then:

```text
┌──────────────────────────────────────────────┐
│ ✅ Accepted                                  │
│                                              │
│ GitHub Sync                                  │
│                                              │
│ ✓ Pushed to GitHub                           │
│                                              │
│ two-sum/solution.py                          │
└──────────────────────────────────────────────┘
```

The status UI should be subtle and should not interfere with LeetCode's existing controls.

---

## B. Chrome extension popup

When the user clicks the extension icon:

```text
┌────────────────────────────────────┐
│  LeetCode → GitHub                 │
│────────────────────────────────────│
│                                    │
│  🟢 Connected                      │
│                                    │
│  Repository                        │
│  github.com/user/leetcode          │
│                                    │
│  Branch                            │
│  main                              │
│                                    │
│────────────────────────────────────│
│  LAST SUBMISSION                   │
│                                    │
│  Two Sum                           │
│  Python                            │
│  ✅ Pushed                         │
│  2 minutes ago                     │
│                                    │
│  [ Open GitHub ]                   │
│                                    │
│  [ Settings ]                      │
└────────────────────────────────────┘
```

---

## C. Settings page

The settings page should be larger than the popup.

```text
┌─────────────────────────────────────────────────────┐
│              LeetCode GitHub Sync                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ GitHub Repository                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ username/leetcode-solutions                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Branch                                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ main                                            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Base Directory                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ leetcode                                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Automation                                          │
│                                                     │
│ ☑ Automatically push accepted submissions          │
│ ☑ Push only accepted submissions                   │
│ ☐ Generate/update README                            │
│                                                     │
│ Notifications                                       │
│                                                     │
│ ☑ Show success notifications                       │
│ ☑ Show error notifications                          │
│                                                     │
│                                                     │
│              [ Save Settings ]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## D. Error UI

If the GitHub service is not running:

```text
┌──────────────────────────────────────┐
│ ⚠ GitHub Sync                        │
├──────────────────────────────────────┤
│                                      │
│ Local GitHub service isn't running.  │
│                                      │
│ Start the LeetCode GitHub server     │
│ and try again.                       │
│                                      │
│ [ Retry ]                            │
│                                      │
└──────────────────────────────────────┘
```

If authentication fails:

```text
┌──────────────────────────────────────┐
│ 🔐 GitHub Authentication Error       │
├──────────────────────────────────────┤
│                                      │
│ GitHub rejected the request.         │
│                                      │
│ Check your GitHub token and           │
│ repository configuration.            │
│                                      │
│ [ Open Settings ]                    │
└──────────────────────────────────────┘
```

---

## E. Overall user experience

The user should experience the product like this:

```text
1. Install extension
        ↓
2. Configure GitHub repository
        ↓
3. Open LeetCode
        ↓
4. Solve a problem
        ↓
5. Click Submit
        ↓
6. LeetCode says Accepted
        ↓
7. Extension detects Accepted
        ↓
8. Extension gets submitted code
        ↓
9. Extension checks for duplicates
        ↓
10. Local service pushes to GitHub
        ↓
11. User sees:
        "✅ Two Sum pushed to GitHub"
```

The technical pipeline is hidden from the user as much as possible.

---

# Recommended V1 Goal

The first working version should only need to do this:

```text
LeetCode
   ↓
Submit
   ↓
Accepted
   ↓
Detect submission
   ↓
Get code
   ↓
localhost Node.js service
   ↓
GitHub
   ↓
leetcode/two-sum/solution.py
```

Do not build README generation, advanced analytics, OAuth, multiple repositories, or a complicated dashboard until this core flow works reliably.
