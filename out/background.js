// Chrome Extension Background Script

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Bye Dashboard extension installed');
    
    // Set default settings
    await chrome.storage.sync.set({
      theme: 'dark',
      firstRun: true,
      syncEnabled: true
    });
    
    // Open onboarding page on install
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html?onboarding=true')
    });
  } else if (details.reason === 'update') {
    console.log('Bye Dashboard extension updated');
  }
});

// Handle authentication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'authenticate') {
    handleAuthentication(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
  
  if (message.type === 'syncData') {
    syncData(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Authentication handler
async function handleAuthentication(data) {
  // This would integrate with your existing auth system
  // For now, we'll just simulate the process
  try {
    // In a real implementation, this would call your auth API
    console.log('Authentication request received', data);
    
    // Store auth tokens securely
    await chrome.storage.local.set({
      authToken: 'simulated-auth-token',
      refreshToken: 'simulated-refresh-token',
      expiresAt: Date.now() + 3600000 // 1 hour from now
    });
    
    return { userId: 'user-123', authenticated: true };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Data synchronization
async function syncData(data) {
  try {
    // Check if sync is enabled
    const settings = await chrome.storage.sync.get('syncEnabled');
    if (!settings.syncEnabled) {
      return { synced: false, reason: 'Sync disabled' };
    }
    
    // In a real implementation, this would sync with your backend
    console.log('Syncing data:', data);
    
    // Simulate successful sync
    return { synced: true, lastSynced: new Date().toISOString() };
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

// Handle periodic sync (every 15 minutes)
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

async function periodicSync() {
  try {
    const settings = await chrome.storage.sync.get('syncEnabled');
    if (settings.syncEnabled) {
      console.log('Performing periodic sync');
      // In a real implementation, this would sync with your backend
    }
  } catch (error) {
    console.error('Periodic sync error:', error);
  }
  
  // Schedule next sync
  setTimeout(periodicSync, SYNC_INTERVAL);
}

// Start periodic sync
periodicSync(); 