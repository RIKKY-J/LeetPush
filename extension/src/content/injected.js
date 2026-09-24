/**
 * LeetPush Injected Script (Runs in LeetCode Page Context / MAIN World)
 * Intercepts LeetCode network requests to ONLY trigger on real Accepted Submissions.
 * STRICTLY ignores "Run Code" / test case executions (/interpret_solution/).
 */
(function() {
  if (window.__LEETPUSH_INJECTED__) return;
  window.__LEETPUSH_INJECTED__ = true;

  console.log("[LeetPush] Submission-only network interceptor initialized.");

  // Holds data ONLY when the user clicks the real "Submit" button
  let activeSubmission = null;

  function notifyContentScript(type, payload) {
    window.postMessage(
      {
        source: "LEETPUSH_PAGE_INTERCEPTOR",
        type,
        payload
      },
      "*"
    );
  }

  function parseBody(body) {
    if (!body) return null;
    try {
      if (typeof body === "string") return JSON.parse(body);
      if (body instanceof FormData) {
        const obj = {};
        body.forEach((val, key) => { obj[key] = val; });
        return obj;
      }
    } catch (e) {
      // not JSON
    }
    return null;
  }

  function handleOutgoingRequest(url, body) {
    if (!url) return;

    // 1. Explicitly detect "Run Code" (/interpret_solution/) -> Cancel any pending state!
    if (url.includes("/interpret_solution/") || url.includes("/test/")) {
      console.log("[LeetPush] User ran test cases. Ignoring from GitHub push.");
      activeSubmission = null;
      return;
    }

    // 2. Real Submission: POST /problems/{slug}/submit/
    if (url.includes("/submit/")) {
      const parsed = parseBody(body);
      if (parsed) {
        activeSubmission = {
          lang: parsed.lang ? parsed.lang.trim().toLowerCase() : null,
          code: parsed.typed_code || parsed.code || null,
          questionId: parsed.question_id || parsed.questionId || null,
          submissionId: null,
          timestamp: Date.now()
        };
        console.log("[LeetPush] Real submission initiated:", {
          lang: activeSubmission.lang,
          questionId: activeSubmission.questionId
        });
      }
    }
  }

  function handleSubmissionResponse(url, data) {
    if (!data) return;

    // Capture submission_id returned from POST /submit/
    if (url.includes("/submit/") && data.submission_id) {
      if (activeSubmission) {
        activeSubmission.submissionId = String(data.submission_id);
        console.log("[LeetPush] Tracking submission ID:", activeSubmission.submissionId);
      }
      return;
    }

    // CRITICAL FILTER: Ignore testcase checks completely!
    // Test case checks contain "mysubmission" in the URL or data.interpret_id
    if (
      url.includes("interpret") ||
      url.includes("mysubmission") ||
      data.interpret_id ||
      data.interpret_status_code
    ) {
      return; // Do NOT process test cases!
    }

    // Check polling endpoint: /submissions/detail/{id}/check/
    if (url.includes("/check/")) {
      // Ensure we have an active submission initiated within the last 3 minutes
      if (!activeSubmission || (Date.now() - activeSubmission.timestamp > 180000)) {
        return;
      }

      // If activeSubmission has an assigned submissionId, ensure the URL matches that ID
      if (activeSubmission.submissionId && !url.includes(activeSubmission.submissionId)) {
        return;
      }

      // Check if the submission finished with "Accepted"
      if (data.status_msg === "Accepted" || (data.state === "SUCCESS" && data.status_code === 10)) {
        console.log("[LeetPush] Confirmed Accepted SUBMISSION! Dispatching push event.");

        const finalLang = data.lang || data.pretty_lang || activeSubmission.lang;
        const finalCode = data.code || activeSubmission.code;
        const questionId = data.question_id || activeSubmission.questionId;
        const submissionId = data.submission_id || activeSubmission.submissionId;

        // Reset active submission so it does not fire again
        activeSubmission = null;

        notifyContentScript("SUBMISSION_ACCEPTED", {
          code: finalCode,
          language: finalLang,
          runtime: data.status_runtime,
          memory: data.status_memory,
          runtimePercentile: data.runtime_percentile,
          memoryPercentile: data.memory_percentile,
          questionId,
          submissionId
        });
      }
    }
  }

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    const options = args[1] || {};

    handleOutgoingRequest(url, options.body);

    const response = await originalFetch.apply(this, args);

    try {
      if (
        url.includes("/submissions/detail/") ||
        url.includes("/check/") ||
        url.includes("/submit/")
      ) {
        const cloned = response.clone();
        cloned.json().then(data => {
          handleSubmissionResponse(url, data);
        }).catch(() => {});
      }
    } catch (e) {}

    return response;
  };

  // Intercept XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._leetpush_url = url;
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    handleOutgoingRequest(this._leetpush_url, body);

    this.addEventListener("load", function() {
      try {
        const url = this._leetpush_url || "";
        if (
          url.includes("/submissions/detail/") ||
          url.includes("/check/") ||
          url.includes("/submit/")
        ) {
          const data = JSON.parse(this.responseText);
          handleSubmissionResponse(url, data);
        }
      } catch (e) {}
    });

    return originalXhrSend.apply(this, arguments);
  };
})();
