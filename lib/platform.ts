/*
 * Where the app is running. IS_EXTENSION is baked in at build time (next.config.js env):
 * true only in the Chrome extension build, where pages are served from chrome-extension://
 * and every /api call and website link has to go to the ClearTab server instead.
 */

export const IS_EXTENSION = process.env.IS_EXTENSION === "true";

// NEXT_PUBLIC_API_BASE_URL is set by scripts/build-extension.mjs (--api=...)
export const API_BASE_URL = IS_EXTENSION
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || "https://cleartab.app").replace(/\/+$/, "")
  : "";

// A page on the ClearTab website (settings, privacy...): relative on the web, absolute in the extension
export function siteUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
