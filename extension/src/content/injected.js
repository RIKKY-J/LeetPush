/**
 * LeetPush Injected Script (Runs in LeetCode Page Context / MAIN World)
 * Intercepts LeetCode network requests and responses to capture:
 * 1. The EXACT language and code submitted (from POST /submit/)
 * 2. The Accepted status and runtime metrics (from /check/ and GraphQL)
 */
(function() {
  if (window.__LEETPUSH_INJECTED__) return;
  window.__LEETPUSH_INJECTED__ = true;

  console.log("[LeetPush] Network interceptor initialized.");

  // Holds the most recently submitted payload from the user
  let pendingSubmission = null;

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
      if (typeof body === "string") {
        return JSON.parse(body);
      }
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

  function recordSubmitRequest(url, body) {
    if (!url || !url.includes("/submit/")) return;
    const parsed = parseBody(body);
    if (parsed) {
      const lang = parsed.lang || parsed.language;
      const code = parsed.typed_code || parsed.code;
      const questionId = parsed.question_id || parsed.questionId;

      if (lang || code) {
        pendingSubmission = {
          lang: lang ? lang.trim().toLowerCase() : null,
          code: code || null,
          questionId: questionId || null,
          timestamp: Date.now()
        };
        console.log("[LeetPush] Recorded submit request:", {
          lang: pendingSubmission.lang,
          hasCode: Boolean(pendingSubmission.code),
          questionId: pendingSubmission.questionId
        });
      }
    }
  }

  // 1. Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    const options = args[1] || {};

    // Capture submit request payload (lang & code)
    if (url.includes("/submit/") && options.body) {
      recordSubmitRequest(url, options.body);
    }

    const response = await originalFetch.apply(this, args);

    try {
      if (
        url.includes("/submissions/detail/") ||
        url.includes("/check/") ||
        url.includes("/submit/") ||
        url.includes("/graphql")
      ) {
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          handlePossibleSubmissionResponse(url, data);
        }).catch(() => {});
      }
    } catch (e) {
      // Ignore
    }

    return response;
  };

  // 2. Intercept XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._leetpush_url = url;
    this._leetpush_method = method;
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this._leetpush_body = body;

    if (this._leetpush_url && this._leetpush_url.includes("/submit/") && body) {
      recordSubmitRequest(this._leetpush_url, body);
    }

    this.addEventListener("load", function() {
      try {
        const url = this._leetpush_url || "";
        if (
          url.includes("/submissions/detail/") ||
          url.includes("/check/") ||
          url.includes("/submit/") ||
          url.includes("/graphql")
        ) {
          const data = JSON.parse(this.responseText);
          handlePossibleSubmissionResponse(url, data);
        }
      } catch (e) {
        // Ignore
      }
    });
    return originalXhrSend.apply(this, arguments);
  };

  function handlePossibleSubmissionResponse(url, data) {
    if (!data) return;

    // Pattern 1: Polling check endpoint /submissions/detail/{id}/check/
    if (data.status_msg === "Accepted" || (data.state === "SUCCESS" && data.status_code === 10)) {
      // Check if we have a recent pending submission within the last 2 minutes
      const hasRecentPending = pendingSubmission && (Date.now() - pendingSubmission.timestamp < 120000);

      const finalLang = data.lang || data.pretty_lang || (hasRecentPending ? pendingSubmission.lang : null);
      const finalCode = data.code || (hasRecentPending ? pendingSubmission.code : null);
      const questionId = data.question_id || (hasRecentPending ? pendingSubmission.questionId : null);

      console.log("[LeetPush] Accepted submission intercepted. Language:", finalLang);

      notifyContentScript("SUBMISSION_ACCEPTED", {
        code: finalCode,
        language: finalLang,
        runtime: data.status_runtime,
        memory: data.status_memory,
        runtimePercentile: data.runtime_percentile,
        memoryPercentile: data.memory_percentile,
        questionId: questionId,
        submissionId: data.submission_id
      });
      return;
    }

    // Pattern 2: GraphQL submissionDetails query
    if (data.data?.submissionDetails) {
      const details = data.data.submissionDetails;
      if (details.statusDisplay === "Accepted") {
        const langName = details.lang?.name || details.lang;
        console.log("[LeetPush] GraphQL Accepted submission. Language:", langName);

        notifyContentScript("SUBMISSION_ACCEPTED", {
          code: details.code,
          language: langName,
          runtime: details.runtimeDisplay,
          memory: details.memoryDisplay,
          questionId: details.question?.questionId,
          slug: details.question?.titleSlug,
          title: details.question?.title
        });
      }
    }
  }
})();
