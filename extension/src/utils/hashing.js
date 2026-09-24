/**
 * LeetPush Anti-Duplicate SHA-256 Hashing Utilities
 */

/**
 * Computes a SHA-256 hexadecimal hash string for a given text
 */
async function computeSha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates unique fingerprint for a submission
 */
async function getSubmissionFingerprint(slug, language, code) {
  // Normalize code by trimming trailing whitespace and line breaks
  const normalizedCode = (code || "").trim().replace(/\r\n/g, "\n");
  const normalizedLang = (language || "").toLowerCase().trim();
  const normalizedSlug = (slug || "").toLowerCase().trim();
  
  const rawKey = `${normalizedSlug}:${normalizedLang}:${normalizedCode}`;
  return await computeSha256(rawKey);
}

/**
 * Checks if a fingerprint has already been synced
 */
async function isFingerprintSynced(fingerprint) {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      resolve(false);
      return;
    }
    chrome.storage.local.get(["synced_fingerprints"], (result) => {
      const list = result.synced_fingerprints || [];
      resolve(list.includes(fingerprint));
    });
  });
}

/**
 * Marks a fingerprint as synced in chrome.storage.local
 */
async function saveSyncedFingerprint(fingerprint) {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      resolve();
      return;
    }
    chrome.storage.local.get(["synced_fingerprints"], (result) => {
      const list = result.synced_fingerprints || [];
      if (!list.includes(fingerprint)) {
        list.push(fingerprint);
        // Keep list bounded to last 1000 items
        if (list.length > 1000) {
          list.shift();
        }
        chrome.storage.local.set({ synced_fingerprints: list }, resolve);
      } else {
        resolve();
      }
    });
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    computeSha256,
    getSubmissionFingerprint,
    isFingerprintSynced,
    saveSyncedFingerprint
  };
}
