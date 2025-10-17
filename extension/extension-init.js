// Extension-specific initialization
window.IS_EXTENSION = true;

// Performance optimizations for extension
const perfStart = performance.now();

// Global error handling for extension context
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('Failed to fetch') ||
      event.error?.message?.includes('NetworkError') ||
      event.error?.message?.includes('Connection')) {
    console.warn('Extension: Network error caught, continuing offline:', event.error.message);
    event.preventDefault();
    return false;
  }
});

// Hide initial loading when React app mounts
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loading = document.getElementById('initial-loading');
    if (loading) {
      loading.classList.add('hidden');
    }
    console.log(`Extension startup: ${performance.now() - perfStart}ms`);
  }, 100);
});

// Fallback timeout for loading screen
setTimeout(() => {
  const loading = document.getElementById('initial-loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}, 2000);