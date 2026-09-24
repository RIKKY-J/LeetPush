const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Chrome Extension requests and localhost
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve companion web dashboard
app.use(express.static(path.join(__dirname, "public")));

// Attach API routes
app.use("/", routes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error"
  });
});

const server = app.listen(PORT, () => {
  console.log(`
=====================================================
  🚀 LeetPush Companion Server is Running!
=====================================================
  Port:        http://localhost:${PORT}
  Dashboard:   http://localhost:${PORT}/
  Health:      http://localhost:${PORT}/health
  Push API:    http://localhost:${PORT}/push
  Target Repo: ${process.env.GITHUB_OWNER || "(not set)"}/${process.env.GITHUB_REPO || "(not set)"}
  Branch:      ${process.env.GITHUB_BRANCH || "main"}
=====================================================
  Waiting for submissions from LeetPush Extension...
`);
});

module.exports = { app, server };
