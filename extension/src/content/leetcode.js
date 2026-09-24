/**
 * LeetPush Content Script Orchestrator
 * Connects page interceptor, submission provider, UI overlay, and background service worker.
 */
(function() {
  console.log("[LeetPush] Content script initialized on", window.location.href);

  // 1. Inject the page interceptor script into MAIN world
  function injectMainWorldScript() {
    try {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("src/content/injected.js");
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      console.warn("[LeetPush] Main script injection failed:", e);
    }
  }

  injectMainWorldScript();

  // 2. Initialize provider and UI overlay
  const provider = new LeetCodeSubmissionProvider();
  const ui = new LeetPushUIOverlay();

  let isPushing = false;
  let lastProcessedTime = 0;

  /**
   * Processes an accepted submission
   */
  async function handleAcceptedSubmission({
    code,
    language,
    runtime,
    memory,
    questionId,
    slug,
    title
  } = {}) {
    if (isPushing) return;

    // Check if auto-push is enabled in settings
    const settings = await getSettings();
    if (settings.autoPush === false) {
      console.log("[LeetPush] Auto-push is disabled in settings.");
      return;
    }

    const currentProblem = provider.getCurrentProblem();
    if (slug) currentProblem.slug = slug;
    if (title) currentProblem.title = title;
    if (questionId) currentProblem.id = questionId;

    const submission = provider.normalizeSubmission({
      problem: currentProblem,
      code,
      language,
      status: "Accepted",
      runtime,
      memory
    });

    if (!submission.code || submission.code.trim().length === 0) {
      console.warn("[LeetPush] No code could be extracted for submission.");
      return;
    }

    // Anti-duplicate protection check
    const fingerprint = await getSubmissionFingerprint(
      submission.problem.slug,
      submission.language,
      submission.code
    );

    const alreadySynced = await isFingerprintSynced(fingerprint);
    if (alreadySynced) {
      console.log("[LeetPush] Submission already synced (duplicate fingerprint).");
      ui.setDuplicate({ slug: submission.problem.slug });
      return;
    }

    // Trigger push
    await executePush(submission, fingerprint);
  }

  /**
   * Sends submission to background worker and handles UI feedback
   */
  async function executePush(submission, fingerprint) {
    isPushing = true;
    ui.setPushing(submission.problem.title || submission.problem.slug);

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "PUSH_SUBMISSION", submission },
          (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res);
            }
          }
        );
      });

      if (response && response.success) {
        console.log("[LeetPush] Push succeeded:", response);
        if (fingerprint) {
          await saveSyncedFingerprint(fingerprint);
        }
        ui.setSuccess({
          slug: submission.problem.slug,
          path: response.path,
          fileUrl: response.fileUrl,
          action: response.action
        });
      } else {
        const errorMsg = response?.error || "Companion server error or network issue";
        console.error("[LeetPush] Push failed:", errorMsg);
        ui.setError(errorMsg, () => executePush(submission, fingerprint));
      }
    } catch (err) {
      console.error("[LeetPush] Communication error with background worker:", err);
      ui.setError(err.message, () => executePush(submission, fingerprint));
    } finally {
      isPushing = false;
      lastProcessedTime = Date.now();
    }
  }

  // 3. User click listener to strictly distinguish Submit from Run
  let userClickedSubmit = false;
  let submitClickTime = 0;

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;

    const btn = target.closest("button");
    if (!btn) return;

    const text = (btn.textContent || "").trim().toLowerCase();
    const e2e = btn.getAttribute("data-e2e-locator") || "";

    if (e2e === "console-run-button" || text === "run" || text.startsWith("run ")) {
      userClickedSubmit = false;
      console.log("[LeetPush] User clicked Run Test Cases. Auto-push disabled.");
    } else if (e2e === "console-submit-button" || text === "submit" || text.startsWith("submit ")) {
      userClickedSubmit = true;
      submitClickTime = Date.now();
      console.log("[LeetPush] User clicked Submit Solution. Auto-push enabled.");
    }
  }, true);

  // 4. Listen for messages from injected interceptor script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== "LEETPUSH_PAGE_INTERCEPTOR") return;

    if (event.data.type === "SUBMISSION_ACCEPTED") {
      userClickedSubmit = false;
      console.log("[LeetPush] Received verified SUBMISSION_ACCEPTED event from interceptor:", event.data.payload);
      handleAcceptedSubmission(event.data.payload);
    }
  });

  // 5. Fallback DOM MutationObserver (ONLY fires if a real Submit click occurred)
  let observerTimer = null;
  const domObserver = new MutationObserver(() => {
    if (observerTimer) clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      // Avoid rapid repeated triggers
      if (Date.now() - lastProcessedTime < 8000) return;
      if (isPushing) return;

      // STRICT CHECK: Only trigger if the user actually clicked the Submit button!
      if (!userClickedSubmit || (Date.now() - submitClickTime > 90000)) {
        return;
      }

      if (provider.isAcceptedInDOM()) {
        console.log("[LeetPush] Real Accepted status detected in DOM after Submit click.");
        userClickedSubmit = false;
        const fallbackCode = provider.getCodeFromEditor();
        if (fallbackCode) {
          handleAcceptedSubmission({ code: fallbackCode });
        }
      }
    }, 1200);
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 5. Listen for manual push trigger from popup or options
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TRIGGER_CURRENT_PAGE_PUSH") {
      const current = provider.normalizeSubmission();
      if (!current.code) {
        sendResponse({ success: false, error: "Could not read code from the current editor." });
        return true;
      }
      executePush(current, null).then(() => {
        sendResponse({ success: true });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }
  });

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        {
          autoPush: true,
          acceptedOnly: true,
          includeReadme: true
        },
        resolve
      );
    });
  }
})();
