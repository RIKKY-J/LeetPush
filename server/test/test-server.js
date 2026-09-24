const assert = require("assert");
const http = require("http");
const { app, server } = require("../src/server");
const { getExtensionForLanguage, generateSolutionPath } = require("../src/github");

async function runTests() {
  console.log("🧪 Starting LeetPush Server Test Suite...");

  // Test 1: Language extension mapping
  assert.strictEqual(getExtensionForLanguage("python"), "py");
  assert.strictEqual(getExtensionForLanguage("python3"), "py");
  assert.strictEqual(getExtensionForLanguage("cpp"), "cpp");
  assert.strictEqual(getExtensionForLanguage("Java"), "java");
  assert.strictEqual(getExtensionForLanguage("javascript"), "js");
  assert.strictEqual(getExtensionForLanguage("rust"), "rs");
  console.log("  ✓ Language extension mapper tests passed");

  // Test 2: Path generation
  const path1 = generateSolutionPath({
    slug: "two-sum",
    language: "python3",
    baseDir: "leetcode"
  });
  assert.strictEqual(path1, "leetcode/two-sum/solution.py");

  const path2 = generateSolutionPath({
    slug: "3sum-closest",
    language: "cpp",
    baseDir: "solutions"
  });
  assert.strictEqual(path2, "solutions/3sum-closest/solution.cpp");
  console.log("  ✓ Repository path generator tests passed");

  // Test 3: Health endpoint via HTTP
  const healthRes = await new Promise((resolve, reject) => {
    http.get("http://localhost:3000/health", (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
      });
    }).on("error", reject);
  });

  assert.strictEqual(healthRes.statusCode, 200);
  assert.strictEqual(healthRes.body.status, "ok");
  assert.strictEqual(healthRes.body.service, "LeetPush Companion Server");
  console.log("  ✓ Health endpoint responded with 200 OK");

  // Test 4: Push validation error on empty payload
  const pushValidationRes = await new Promise((resolve, reject) => {
    const req = http.request(
      "http://localhost:3000/push",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      (res) => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        });
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify({}));
    req.end();
  });

  assert.strictEqual(pushValidationRes.statusCode, 400);
  assert.strictEqual(pushValidationRes.body.success, false);
  console.log("  ✓ Push validation rejects invalid requests as expected");

  console.log("🎉 All Server Tests Passed Successfully!\n");
  server.close();
  process.exit(0);
}

// Give server time to bind then test
setTimeout(runTests, 500);
