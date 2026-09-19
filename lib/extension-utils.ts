/**
 * Utility functions for Chrome extension environment detection
 */

/**
 * Detects if the code is running in a Chrome extension environment
 */
export function isExtensionEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Chrome extension APIs
  const hasExtensionAPI = !!(
    (window as any).chrome &&
    (window as any).chrome.runtime &&
    (window as any).chrome.runtime.id
  );

  // Check if we're in an extension context (new tab override)
  const isNewTabOverride = window.location.protocol === 'chrome-extension:';

  // Check for extension environment variable (set during build)
  const isExtensionBuild = process.env.IS_EXTENSION === 'true';

  return hasExtensionAPI || isNewTabOverride || isExtensionBuild;
}

/**
 * Gets the appropriate Supabase client based on environment
 */
export async function getSupabaseClient() {
  if (isExtensionEnvironment()) {
    const { createExtensionClient } = await import('@/lib/supabase/extension-client');
    return createExtensionClient();
  } else {
    // Non-extension environment now uses NextAuth
    return null;
  }
}

/**
 * Gets the appropriate auth context based on environment
 */
export function getAuthProvider() {
  if (isExtensionEnvironment()) {
    return 'extension';
  } else {
    return 'supabase';
  }
}