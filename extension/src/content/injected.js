/**
 * LeetPush Injected Script (Runs in LeetCode Page Context / MAIN World)
 * Intercepts LeetCode network responses to capture exact submitted code on Accepted.
 */
(function() {
  if (window.__LEETPUSH_INJECTED__) return;
  window.__LEETPUSH_INJECTED__ = true;

  console.log("[LeetPush] Network interceptor initialized.");

  // Helper to post messages back to the content script
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

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    try {
      // Check if this is a submission check endpoint or GraphQL query
      if (
        url.includes("/submissions/detail/") ||
        url.includes("/check/") ||
        url.includes("/submit/") ||
        url.includes("/graphql")
      ) {
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          handlePossibleSubmissionResponse(url, data, args[1]);
        }).catch(() => {});
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return response;
  };

  // Intercept XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._leetpush_url = url;
    this._leetpush_method = method;
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this._leetpush_body = body;
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
          handlePossibleSubmissionResponse(url, data, { body: this._leetpush_body });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    return originalXhrSend.apply(this, arguments);
  };

  function handlePossibleSubmissionResponse(url, data, requestOptions) {
    if (!data) return;

    // Pattern 1: Polling check endpoint /submissions/detail/{id}/check/
    if (data.status_msg === "Accepted" || (data.state === "SUCCESS" && data.status_code === 10)) {
      console.log("[LeetPush] Intercepted Accepted Submission via check API:", data);
      notifyContentScript("SUBMISSION_ACCEPTED", {
        code: data.code,
        language: data.lang || data.pretty_lang,
        runtime: data.status_runtime,
        memory: data.status_memory,
        runtimePercentile: data.runtime_percentile,
        memoryPercentile: data.memory_percentile,
        questionId: data.question_id,
        submissionId: data.submission_id
      });
      return;
    }

    // Pattern 2: GraphQL submissionDetails query
    if (data.data?.submissionDetails) {
      const details = data.data.submissionDetails;
      if (details.statusDisplay === "Accepted") {
        console.log("[LeetPush] Intercepted Accepted Submission via GraphQL:", details);
        notifyContentScript("SUBMISSION_ACCEPTED", {
          code: details.code,
          language: details.lang?.name || details.lang,
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
