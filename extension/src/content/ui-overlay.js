/**
 * LeetPush In-Page UI Overlay
 * Adds a modern, floating status indicator on LeetCode problem pages.
 */
class LeetPushUIOverlay {
  constructor() {
    this.container = null;
    this.isCollapsed = false;
    this.init();
  }

  init() {
    if (document.getElementById("leetpush-overlay-container")) return;

    this.container = document.createElement("div");
    this.container.id = "leetpush-overlay-container";
    this.container.className = "leetpush-overlay";

    this.container.innerHTML = `
      <div class="leetpush-card" id="leetpush-card">
        <div class="leetpush-badge-header">
          <div class="leetpush-logo">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div class="leetpush-title-wrap">
            <span class="leetpush-brand-title">LeetPush</span>
            <span class="leetpush-status-dot ready" id="leetpush-status-dot"></span>
          </div>
          <button class="leetpush-collapse-btn" id="leetpush-collapse-btn" title="Toggle overlay">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div class="leetpush-body" id="leetpush-body">
          <div class="leetpush-status-text" id="leetpush-status-text">
            GitHub Sync: <strong class="text-ready">Ready</strong>
          </div>
          <div class="leetpush-details" id="leetpush-details" style="display: none;"></div>
          <div class="leetpush-actions" id="leetpush-actions" style="display: none;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    const collapseBtn = document.getElementById("leetpush-collapse-btn");
    const body = document.getElementById("leetpush-body");
    collapseBtn.addEventListener("click", () => {
      this.isCollapsed = !this.isCollapsed;
      body.style.display = this.isCollapsed ? "none" : "block";
      collapseBtn.style.transform = this.isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
    });
  }

  setReady() {
    this._updateUI({
      dotClass: "ready",
      statusHtml: 'GitHub Sync: <strong class="text-ready">Ready</strong>',
      detailsHtml: "",
      actionsHtml: ""
    });
  }

  setPushing(slug) {
    this._updateUI({
      dotClass: "pushing",
      statusHtml: `
        <span class="leetpush-spinner"></span>
        <span>Pushing <strong>${slug || "solution"}</strong> to GitHub...</span>
      `,
      detailsHtml: '<span class="leetpush-subtext">Connecting to sync bridge...</span>',
      actionsHtml: ""
    });
  }

  setSuccess({ slug, path, fileUrl, action }) {
    const actionText = action === "update" ? "Updated" : "Pushed";
    this._updateUI({
      dotClass: "success",
      statusHtml: `<span>✓ <strong>${actionText} to GitHub!</strong></span>`,
      detailsHtml: `<span class="leetpush-file-path" title="${path}">${path}</span>`,
      actionsHtml: fileUrl
        ? `<a href="${fileUrl}" target="_blank" rel="noopener" class="leetpush-link-btn">View on GitHub →</a>`
        : ""
    });

    // Auto-restore to ready status after 12 seconds
    setTimeout(() => {
      this.setReady();
    }, 12000);
  }

  setDuplicate({ slug }) {
    this._updateUI({
      dotClass: "info",
      statusHtml: `<span>ℹ <strong>Already up to date</strong></span>`,
      detailsHtml: `<span class="leetpush-subtext">${slug} solution is identical in GitHub</span>`,
      actionsHtml: ""
    });

    setTimeout(() => {
      this.setReady();
    }, 6000);
  }

  setError(errorMessage, onRetry) {
    this._updateUI({
      dotClass: "error",
      statusHtml: `<span>⚠ <strong>Sync Failed</strong></span>`,
      detailsHtml: `<span class="leetpush-error-msg">${errorMessage || "Unable to sync"}</span>`,
      actionsHtml: onRetry
        ? `<button id="leetpush-retry-btn" class="leetpush-retry-btn">Retry Push</button>`
        : ""
    });

    if (onRetry) {
      const retryBtn = document.getElementById("leetpush-retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          onRetry();
        });
      }
    }
  }

  _updateUI({ dotClass, statusHtml, detailsHtml, actionsHtml }) {
    if (!this.container) this.init();

    const dot = document.getElementById("leetpush-status-dot");
    const statusText = document.getElementById("leetpush-status-text");
    const details = document.getElementById("leetpush-details");
    const actions = document.getElementById("leetpush-actions");

    if (dot) {
      dot.className = `leetpush-status-dot ${dotClass}`;
    }
    if (statusText) {
      statusText.innerHTML = statusHtml;
    }
    if (details) {
      if (detailsHtml) {
        details.innerHTML = detailsHtml;
        details.style.display = "block";
      } else {
        details.style.display = "none";
      }
    }
    if (actions) {
      if (actionsHtml) {
        actions.innerHTML = actionsHtml;
        actions.style.display = "flex";
      } else {
        actions.style.display = "none";
      }
    }
  }
}

window.LeetPushUIOverlay = LeetPushUIOverlay;
