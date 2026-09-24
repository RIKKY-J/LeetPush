const { Octokit } = require("@octokit/rest");

const LANGUAGE_EXTENSIONS = {
  python: "py",
  python3: "py",
  py: "py",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  java: "java",
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  go: "go",
  golang: "go",
  rust: "rs",
  rs: "rs",
  kotlin: "kt",
  swift: "swift",
  csharp: "cs",
  "c#": "cs",
  php: "php",
  ruby: "rb",
  scala: "scala",
  dart: "dart",
  elixir: "ex",
  erlang: "erl",
  racket: "rkt",
  mysql: "sql",
  "ms sql server": "sql",
  oracle: "sql",
  postgresql: "sql",
  pandas: "py",
  bash: "sh"
};

/**
 * Normalizes language name to appropriate file extension
 */
function getExtensionForLanguage(language) {
  if (!language) return "txt";
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized] || "txt";
}

/**
 * Creates Octokit client with given token or environment token
 */
function getOctokit(token) {
  const authToken = token || process.env.GITHUB_TOKEN;
  if (!authToken || authToken.trim() === "" || authToken === "your_personal_access_token_here") {
    throw new Error("GitHub token is not configured. Please set GITHUB_TOKEN in your .env or options.");
  }
  return new Octokit({ auth: authToken.trim() });
}

/**
 * Verifies GitHub authentication and repository access
 */
async function verifyConnection(customConfig = {}) {
  const token = customConfig.token || process.env.GITHUB_TOKEN;
  const owner = customConfig.owner || process.env.GITHUB_OWNER;
  const repo = customConfig.repo || process.env.GITHUB_REPO;

  if (!token || token === "your_personal_access_token_here") {
    return {
      success: false,
      authenticated: false,
      error: "GitHub token is missing or placeholder in .env"
    };
  }

  try {
    const octokit = getOctokit(token);
    const userRes = await octokit.users.getAuthenticated();
    const username = userRes.data.login;

    let repoDetails = null;
    let repoAccessible = false;

    if (owner && repo) {
      try {
        const repoRes = await octokit.repos.get({ owner, repo });
        repoDetails = {
          name: repoRes.data.full_name,
          defaultBranch: repoRes.data.default_branch,
          private: repoRes.data.private,
          permissions: repoRes.data.permissions
        };
        repoAccessible = true;
      } catch (repoErr) {
        return {
          success: false,
          authenticated: true,
          username,
          repoAccessible: false,
          error: `Repository '${owner}/${repo}' not found or no write permission (${repoErr.message})`
        };
      }
    }

    return {
      success: true,
      authenticated: true,
      username,
      repoAccessible,
      repoDetails
    };
  } catch (err) {
    return {
      success: false,
      authenticated: false,
      error: err.message || "Failed to authenticate with GitHub"
    };
  }
}

/**
 * Retrieves the SHA of an existing file if present, or null if it doesn't exist
 */
async function getFileSha(octokit, { owner, repo, path, branch }) {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });
    return response.data.sha;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Generates a clean repository path for the solution
 */
function generateSolutionPath({ slug, id, language, baseDir = "leetcode" }) {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const ext = getExtensionForLanguage(language);
  const cleanBaseDir = baseDir.replace(/^\/+|\/+$/g, "");
  
  // Format: leetcode/{slug}/solution.{ext}
  const folder = cleanBaseDir ? `${cleanBaseDir}/${cleanSlug}` : cleanSlug;
  return `${folder}/solution.${ext}`;
}

/**
 * Pushes a solution file to GitHub repository
 */
async function pushSolutionToGithub({
  problem,
  language,
  code,
  runtime,
  memory,
  config = {}
}) {
  const owner = config.owner || process.env.GITHUB_OWNER;
  const repo = config.repo || process.env.GITHUB_REPO;
  const branch = config.branch || process.env.GITHUB_BRANCH || "main";
  const baseDir = config.baseDir || process.env.GITHUB_BASE_DIR || "leetcode";
  const token = config.token || process.env.GITHUB_TOKEN;

  if (!owner || !repo) {
    throw new Error("Repository owner and name must be configured (e.g. GITHUB_OWNER and GITHUB_REPO).");
  }

  const octokit = getOctokit(token);
  const slug = problem.slug || problem.title.toLowerCase().replace(/\s+/g, "-");
  const path = generateSolutionPath({
    slug,
    id: problem.id,
    language,
    baseDir
  });

  // Check if file already exists
  const existingSha = await getFileSha(octokit, { owner, repo, path, branch });
  const action = existingSha ? "update" : "create";

  const messagePrefix = process.env.COMMIT_MESSAGE_PREFIX || "leetcode";
  const commitMessage = `${messagePrefix}: add ${slug} (${language})${
    runtime ? ` [${runtime}, ${memory || ""}]`.trim() : ""
  }`;

  // Commit the solution code
  const contentBase64 = Buffer.from(code, "utf8").toString("base64");

  const commitPayload = {
    owner,
    repo,
    path,
    message: commitMessage,
    content: contentBase64,
    branch
  };

  if (existingSha) {
    commitPayload.sha = existingSha;
  }

  const response = await octokit.repos.createOrUpdateFileContents(commitPayload);

  // Optional: If problem description is provided, also write or update README.md in the problem folder
  let readmeResult = null;
  if (problem.description && config.includeReadme !== false) {
    try {
      const readmePath = `${baseDir}/${slug}/README.md`;
      const readmeSha = await getFileSha(octokit, { owner, repo, path: readmePath, branch });
      
      const difficultyBadge = problem.difficulty 
        ? `![Difficulty](https://img.shields.io/badge/Difficulty-${encodeURIComponent(problem.difficulty)}-${
            problem.difficulty === "Easy" ? "brightgreen" : problem.difficulty === "Medium" ? "orange" : "red"
          })\n\n`
        : "";

      const readmeContent = `# ${problem.title || slug}\n\n${difficultyBadge}` +
        `**Problem Link**: [LeetCode Problem](https://leetcode.com/problems/${slug}/)\n\n` +
        `## Problem Description\n\n${problem.description}\n\n` +
        `---\n*Synced automatically with [LeetPush](https://github.com/RIKKY-J/LeetPush)*`;

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: readmePath,
        message: `${messagePrefix}: doc ${slug} README`,
        content: Buffer.from(readmeContent, "utf8").toString("base64"),
        branch,
        ...(readmeSha ? { sha: readmeSha } : {})
      });
      readmeResult = { path: readmePath, status: readmeSha ? "updated" : "created" };
    } catch (readmeErr) {
      console.warn("Failed to create problem README (non-critical):", readmeErr.message);
    }
  }

  return {
    success: true,
    action,
    path,
    sha: response.data.content?.sha || response.data.commit?.sha,
    commitSha: response.data.commit?.sha,
    commitUrl: response.data.commit?.html_url,
    fileUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${path}`,
    readme: readmeResult
  };
}

module.exports = {
  LANGUAGE_EXTENSIONS,
  getExtensionForLanguage,
  verifyConnection,
  generateSolutionPath,
  pushSolutionToGithub,
  getOctokit
};
