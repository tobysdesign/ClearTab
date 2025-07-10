// Popup script for Bye Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI
  initializeUI();
  
  // Load tasks
  await loadTasks();
  
  // Update sync status
  updateSyncStatus();
});

// Initialize UI and event listeners
function initializeUI() {
  // Open dashboard button
  document.getElementById('open-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  });
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?settings=true') });
  });
  
  // New note shortcut
  document.getElementById('new-note').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?new=note') });
  });
  
  // New task shortcut
  document.getElementById('new-task').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?new=task') });
  });
  
  // Record meeting shortcut
  document.getElementById('record-meeting').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?record=meeting') });
  });
  
  // Open dashboard shortcut
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  });
}

// Load tasks from storage or API
async function loadTasks() {
  try {
    // Check if we have an auth token
    const auth = await chrome.storage.local.get(['authToken', 'expiresAt']);
    
    if (!auth.authToken || Date.now() > auth.expiresAt) {
      // Not authenticated or token expired
      displayTasks([
        { 
          title: 'Sign in to view your tasks', 
          dueDate: null 
        }
      ]);
      return;
    }
    
    // Try to get tasks from local storage first
    const storage = await chrome.storage.local.get('cachedTasks');
    
    if (storage.cachedTasks) {
      displayTasks(storage.cachedTasks);
    }
    
    // Then try to fetch from API
    try {
      // In a real implementation, this would call your API
      // For now, we'll use mock data
      const mockTasks = [
        {
          title: 'Finish project proposal',
          dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        },
        {
          title: 'Call client about requirements',
          dueDate: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
        },
        {
          title: 'Review team progress',
          dueDate: new Date(Date.now() + 259200000).toISOString() // 3 days from now
        }
      ];
      
      // Cache tasks
      await chrome.storage.local.set({ 
        cachedTasks: mockTasks,
        lastTaskSync: Date.now()
      });
      
      // Display tasks
      displayTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // If API call fails but we have cached data, we already displayed it
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
    displayTasks([{ title: 'Error loading tasks', dueDate: null }]);
  }
}

// Display tasks in the UI
function displayTasks(tasks) {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = `
      <div class="task-item">
        <div class="task-title">No tasks found</div>
      </div>
    `;
    return;
  }
  
  tasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    
    let dueText = '';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (dueDate.toDateString() === today.toDateString()) {
        dueText = 'Due today';
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        dueText = 'Due tomorrow';
      } else {
        dueText = `Due ${dueDate.toLocaleDateString()}`;
      }
    }
    
    taskElement.innerHTML = `
      <div class="task-title">${task.title}</div>
      ${dueText ? `<div class="task-due">${dueText}</div>` : ''}
    `;
    
    taskList.appendChild(taskElement);
  });
}

// Update sync status
async function updateSyncStatus() {
  const syncStatus = document.getElementById('sync-status');
  
  try {
    const storage = await chrome.storage.local.get('lastTaskSync');
    
    if (storage.lastTaskSync) {
      const lastSync = new Date(storage.lastTaskSync);
      syncStatus.textContent = `Last sync: ${lastSync.toLocaleTimeString()}`;
    } else {
      syncStatus.textContent = 'Last sync: Never';
    }
  } catch (error) {
    console.error('Error updating sync status:', error);
    syncStatus.textContent = 'Sync status: Error';
  }
} 