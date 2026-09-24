const express = require("express");
const { pushSolutionToGithub, verifyConnection } = require("./github");

const router = express.Router();

// In-memory history log for recent pushes (capped at 100 entries)
const syncHistory = [];

/**
 * Health check endpoint
 */
router.get("/health", async (req, res) => {
  const tokenConfigured = Boolean(
    process.env.GITHUB_TOKEN &&
    process.env.GITHUB_TOKEN !== "your_personal_access_token_here" &&
    process.env.GITHUB_TOKEN.trim() !== ""
  );

  res.json({
    status: "ok",
    service: "LeetPush Companion Server",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    config: {
      owner: process.env.GITHUB_OWNER || null,
      repo: process.env.GITHUB_REPO || null,
      branch: process.env.GITHUB_BRANCH || "main",
      baseDir: process.env.GITHUB_BASE_DIR || "leetcode",
      tokenConfigured
    }
  });
});

/**
 * Main push endpoint
 * Expects: { problem: { title, slug, id, difficulty, description }, language, code, runtime, memory, config }
 */
router.post("/push", async (req, res) => {
  try {
    const { problem, language, code, runtime, memory, config } = req.body;

    if (!problem || (!problem.title && !problem.slug)) {
      return res.status(400).json({
        success: false,
        error: "Missing required problem information (title or slug)."
      });
    }

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: "Missing required submission language or code."
      });
    }

    const pushResult = await pushSolutionToGithub({
      problem,
      language,
      code,
      runtime,
      memory,
      config: config || {}
    });

    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      problemTitle: problem.title || problem.slug,
      slug: problem.slug,
      language,
      action: pushResult.action,
      path: pushResult.path,
      fileUrl: pushResult.fileUrl,
      commitUrl: pushResult.commitUrl,
      success: true
    };

    syncHistory.unshift(historyEntry);
    if (syncHistory.length > 100) {
      syncHistory.pop();
    }

    return res.json({
      success: true,
      message: `Successfully pushed ${problem.title || problem.slug} to GitHub!`,
      ...pushResult
    });
  } catch (error) {
    console.error("Push error:", error);

    const failedEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      problemTitle: req.body?.problem?.title || req.body?.problem?.slug || "Unknown problem",
      language: req.body?.language || "Unknown",
      success: false,
      error: error.message
    };
    syncHistory.unshift(failedEntry);
    if (syncHistory.length > 100) {
      syncHistory.pop();
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to push code to GitHub"
    });
  }
});

/**
 * Test GitHub connection endpoint
 */
router.post("/api/test-connection", async (req, res) => {
  try {
    const customConfig = req.body || {};
    const result = await verifyConnection(customConfig);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sync history endpoint
 */
router.get("/api/history", (req, res) => {
  res.json({
    total: syncHistory.length,
    history: syncHistory
  });
});

/**
 * Clear history endpoint
 */
router.delete("/api/history", (req, res) => {
  syncHistory.length = 0;
  res.json({ success: true, message: "History cleared." });
});

/**
 * Server configuration endpoint
 */
router.get("/api/config", (req, res) => {
  const token = process.env.GITHUB_TOKEN || "";
  const tokenConfigured = Boolean(token && token !== "your_personal_access_token_here");
  
  res.json({
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
    baseDir: process.env.GITHUB_BASE_DIR || "leetcode",
    tokenConfigured,
    tokenPreview: tokenConfigured ? `${token.substring(0, 4)}...${token.slice(-4)}` : null
  });
});

module.exports = router;
