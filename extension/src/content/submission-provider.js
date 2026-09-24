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
   * Normalizes raw language strings (e.g., "C++", "python3", "Java") to standard keys
   */
  normalizeLanguage(rawLang) {
    if (!rawLang) return null;
    const clean = rawLang.trim().toLowerCase();

    if (clean === "c++" || clean === "cpp") return "cpp";
    if (clean === "c") return "c";
    if (clean === "java") return "java";
    if (clean === "c#" || clean === "csharp" || clean === "cs") return "csharp";
    if (clean.includes("python3") || clean === "python 3") return "python3";
    if (clean === "python" || clean === "py") return "python";
    if (clean.includes("javascript") || clean === "js") return "javascript";
    if (clean.includes("typescript") || clean === "ts") return "typescript";
    if (clean === "golang" || clean === "go") return "go";
    if (clean === "rust" || clean === "rs") return "rust";
    if (clean === "kotlin" || clean === "kt") return "kotlin";
    if (clean === "swift") return "swift";
    if (clean === "ruby" || clean === "rb") return "ruby";
    if (clean === "php") return "php";
    if (clean === "dart") return "dart";
    if (clean === "scala") return "scala";
    if (clean.includes("sql")) return "mysql";

    return clean;
  }

  /**
   * Extracts language using multiple redundant strategies
   */
  getCurrentLanguage() {
    // Strategy 1: Check LeetCode's localStorage settings
    try {
      const localLang = localStorage.getItem("global_lang") ||
                        localStorage.getItem("last_selected_lang") ||
                        localStorage.getItem("dynamic_layout_language");
      if (localLang) {
        const norm = this.normalizeLanguage(localLang);
        if (norm) {
          console.log("[LeetPush] Detected language from localStorage:", norm);
          return norm;
        }
      }
    } catch (e) {
      // localStorage may be sandboxed
    }

    // Strategy 2: Check Monaco Editor's data-mode-id attribute
    const monacoEl = document.querySelector('[data-mode-id]');
    if (monacoEl) {
      const modeId = monacoEl.getAttribute('data-mode-id');
      const norm = this.normalizeLanguage(modeId);
      if (norm) {
        console.log("[LeetPush] Detected language from Monaco data-mode-id:", norm);
        return norm;
      }
    }

    // Strategy 3: Check editor toolbar language button
    const btnCandidates = [
      'button[id*="headlessui-listbox-button"]',
      'button[data-cy="lang-select"]',
      'div[class*="editor"] button',
      'div[class*="toolbar"] button',
      'button[aria-haspopup="listbox"]'
    ];

    const knownLangs = [
      "c++", "java", "python3", "python", "c", "c#", "javascript",
      "typescript", "go", "rust", "kotlin", "swift", "php", "ruby", "dart", "scala"
    ];

    for (const selector of btnCandidates) {
      const buttons = document.querySelectorAll(selector);
      for (const btn of buttons) {
        const text = btn.textContent.trim().toLowerCase();
        for (const lang of knownLangs) {
          if (text === lang || text.startsWith(lang + " ") || text.startsWith(lang + "\n")) {
            const norm = this.normalizeLanguage(lang);
            console.log("[LeetPush] Detected language from button:", norm);
            return norm;
          }
        }
      }
    }

    // Strategy 4: Check submission result panel for language tag
    const resultPanels = document.querySelectorAll('[data-e2e-locator="submission-result"], div[class*="result"]');
    for (const panel of resultPanels) {
      const parent = panel.closest('div') || panel;
      const text = parent.innerText || "";
      for (const lang of knownLangs) {
        const regex = new RegExp(`\\b${lang.replace('+', '\\+')}\\b`, 'i');
        if (regex.test(text)) {
          const norm = this.normalizeLanguage(lang);
          console.log("[LeetPush] Detected language from result panel:", norm);
          return norm;
        }
      }
    }

    return "cpp"; // Safe default if none matched
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
   * Checks if the DOM currently shows a REAL "Accepted" submission state
   * (Strictly ignores "Run Code" / sample test case panels)
   */
  isAcceptedInDOM() {
    const acceptedSelectors = [
      '[data-e2e-locator="submission-result"]',
      'span[data-e2e-locator="submission-result"]',
      'div[class*="submission-result"]',
      'div[class*="submissions"] div[class*="text-green"]',
      'div[class*="submissions"] div[class*="text-sd-easy"]'
    ];

    for (const sel of acceptedSelectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        // Exclude elements inside testcase/test-result panels
        if (el.closest('[id*="testcase"], [class*="testcase"], [class*="test-result"], [data-layout-path*="testcase"]')) {
          continue;
        }

        const text = el.textContent.trim().toLowerCase();
        if (text.includes("accepted")) {
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
    const rawLang = language || this.getCurrentLanguage();
    const finalLang = this.normalizeLanguage(rawLang) || "cpp";
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
