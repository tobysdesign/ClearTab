// Filter out preload warnings in development
// Add this script to your HTML to suppress noisy Next.js preload warnings
(function() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;
  
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('preload') || message.includes('preloaded')) {
      return; // Suppress preload warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('preload') || message.includes('preloaded')) {
      return; // Suppress preload errors
    }
    originalError.apply(console, args);
  };
})();
