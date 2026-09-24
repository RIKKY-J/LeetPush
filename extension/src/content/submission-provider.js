/**
 * LeetCodeSubmissionProvider
 * Robust extraction abstraction layer for LeetCode problem details & submissions.
 */
class LeetCodeSubmissionProvider {
  /**
   * Extracts current problem information from the page
   */
  getCurrentProblem() {
    const slug = this.extractSlug();
    const title = this.extractTitle(slug);
    const id = this.extractProblemId(title);
    const difficulty = this.extractDifficulty();
    const description = this.extractDescription();

    return {
      slug,
      title,
      id,
      difficulty,
      description
    };
  }

  /**
   * Extracts the problem slug from current window location
   */
  extractSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1].toLowerCase() : "unknown-problem";
  }

  /**
   * Extracts problem title from DOM or title tag, fallback to slug
   */
  extractTitle(slug = "") {
    // Strategy 1: Data-cy attribute
    const cyTitleEl = document.querySelector('[data-cy="question-title"]');
    if (cyTitleEl && cyTitleEl.textContent.trim()) {
      return cyTitleEl.textContent.trim().replace(/^\d+\.\s*/, "");
    }

    // Strategy 2: Common LeetCode title headers
    const titleCandidates = [
      'div[class*="text-title-large"]',
      'div[data-track-load="description_content"] h1',
      'div[class*="flex items-start"] a[href*="/problems/"]',
      'h1'
    ];

    for (const selector of titleCandidates) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        const text = el.textContent.trim();
        // Skip if this is a generic header like "Description" or "Editorial"
        if (!["description", "editorial", "solutions", "submissions"].includes(text.toLowerCase())) {
          return text.replace(/^\d+\.\s*/, "");
        }
      }
    }

    // Strategy 3: Parse document.title (e.g. "1. Two Sum - LeetCode")
    if (document.title) {
      const parts = document.title.split("-");
      if (parts.length > 0) {
        const clean = parts[0].trim().replace(/^\d+\.\s*/, "");
        if (clean && clean.toLowerCase() !== "leetcode") {
          return clean;
        }
      }
    }

    // Strategy 4: Fallback to title-cased slug
    return (slug || this.extractSlug())
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Extracts problem ID (e.g., "1" for Two Sum)
   */
  extractProblemId(title = "") {
    // Check if title in document has "1. Two Sum"
    const titleEl = document.querySelector('[data-cy="question-title"]') || document.querySelector('h1');
    const fullText = titleEl ? titleEl.textContent.trim() : document.title;
    const match = fullText.match(/^(\d+)\./);
    if (match) return match[1];

    // Check meta tags or links
    const metaMatch = document.title.match(/^(\d+)\./);
    if (metaMatch) return metaMatch[1];

    return null;
  }

  /**
   * Extracts difficulty (Easy, Medium, Hard)
   */
  extractDifficulty() {
    const diffSelectors = [
      'div[class*="text-difficulty-"]',
      'span[class*="text-difficulty-"]',
      'div[class*="text-olive"]',
      'div[class*="text-yellow"]',
      'div[class*="text-pink"]',
      'div[class*="text-sd-easy"]',
      'div[class*="text-sd-medium"]',
      'div[class*="text-sd-hard"]'
    ];

    for (const sel of diffSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        const text = el.textContent.trim();
        if (["easy", "medium", "hard"].includes(text.toLowerCase())) {
          return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        }
      }
    }

    // Search for text nodes matching Easy/Medium/Hard in description metadata
    const allSpans = document.querySelectorAll('span, div');
    for (const el of allSpans) {
      const text = el.textContent.trim();
      if (text === "Easy" || text === "Medium" || text === "Hard") {
        if (el.children.length === 0) return text;
      }
    }

    return "Unknown";
  }

  /**
   * Extracts problem description content
   */
  extractDescription() {
    const descEl = document.querySelector('[data-track-load="description_content"]') ||
                   document.querySelector('.question-content') ||
                   document.querySelector('div[class*="elfjS"]');

    if (descEl) {
      return descEl.innerText.trim();
    }
    return "";
  }

  /**
   * Extracts language from the editor dropdown button
   */
  getCurrentLanguage() {
    // LeetCode language dropdown button
    const btnCandidates = [
      'button[id*="headlessui-listbox-button"]',
      'button[data-cy="lang-select"]',
      'div[class*="select-container"] button',
      'button[aria-haspopup="listbox"]'
    ];

    for (const selector of btnCandidates) {
      const buttons = document.querySelectorAll(selector);
      for (const btn of buttons) {
        const text = btn.textContent.trim().toLowerCase();
        // Check if button text matches any known language
        for (const langKey of Object.keys(LEETPUSH_LANGUAGES)) {
          if (text === langKey || text.startsWith(langKey)) {
            return langKey;
          }
        }
      }
    }

    return "python3"; // Default fallback
  }

  /**
   * Fallback: extracts code directly from Monaco editor DOM
   */
  getCodeFromEditor() {
    try {
      const lines = document.querySelectorAll('.monaco-editor .view-line');
      if (lines && lines.length > 0) {
        return Array.from(lines)
          .map(line => line.textContent)
          .join("\n");
      }

      const textarea = document.querySelector('.monaco-editor textarea');
      if (textarea && textarea.value) {
        return textarea.value;
      }
    } catch (e) {
      console.warn("[LeetPush] Could not read editor code:", e);
    }
    return null;
  }

  /**
   * Checks if the DOM currently shows an "Accepted" state
   */
  isAcceptedInDOM() {
    const acceptedSelectors = [
      '[data-e2e-locator="submission-result"]',
      'span[data-e2e-locator="submission-result"]',
      'div[class*="text-green"]',
      'div[class*="text-sd-easy"]',
      'span[class*="text-green"]'
    ];

    for (const sel of acceptedSelectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        if (el.textContent.trim().toLowerCase().includes("accepted")) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Builds normalized submission object
   */
  normalizeSubmission({
    problem = null,
    code = "",
    language = "",
    status = "Accepted",
    runtime = "",
    memory = ""
  } = {}) {
    const currentProb = problem || this.getCurrentProblem();
    const finalLang = language || this.getCurrentLanguage();
    const finalCode = code || this.getCodeFromEditor() || "";

    return {
      problem: currentProb,
      language: finalLang,
      code: finalCode,
      status: status || "Accepted",
      runtime: runtime || null,
      memory: memory || null,
      submittedAt: new Date().toISOString()
    };
  }
}

window.LeetCodeSubmissionProvider = LeetCodeSubmissionProvider;
