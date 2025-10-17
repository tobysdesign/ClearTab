// Extension background script (service worker)

console.log('Extension background script loaded')

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)

  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      settings: {
        theme: 'dark',
        notifications: true,
        syncData: false
      }
    })
  }
})

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started')
})

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes, 'in', namespace)
})

// Handle tab updates for new tab override
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url === 'chrome://newtab/') {
    // Handle new tab logic if needed
    console.log('New tab opened')
  }
})

// Message handling from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)

  switch (message.type) {
    case 'GET_STORAGE':
      chrome.storage.local.get(message.keys, (result) => {
        sendResponse({ success: true, data: result })
      })
      return true // Indicates async response

    case 'SET_STORAGE':
      chrome.storage.local.set(message.data, () => {
        sendResponse({ success: true })
      })
      return true

    case 'CLEAR_STORAGE':
      chrome.storage.local.clear(() => {
        sendResponse({ success: true })
      })
      return true

    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

// Performance monitoring
const startTime = Date.now()
chrome.runtime.onStartup.addListener(() => {
  const loadTime = Date.now() - startTime
  console.log(`Extension background loaded in ${loadTime}ms`)
})

// Export for Vite build (if needed)
export {}