/**
 * Dispatches a global event to open the settings drawer without a page reload.
 * This is the preferred way to open settings from within the dashboard.
 */
export function openSettings(tab?: string) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent('openSettings', {
    detail: { tab }
  });
  window.dispatchEvent(event);
}
