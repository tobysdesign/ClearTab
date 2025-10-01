const fs = require('fs');
const path = require('path');

const config = {
  outputDir: path.join(__dirname, '..', 'dist', 'extension')
};

// Copy the simple HTML from the previously working extension
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bye - Personal Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body, html {
      width: 100vw;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      overflow: hidden;
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 16px;
      padding: 16px;
      height: 100vh;
    }
    
    .widget {
      background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #333;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .widget:hover {
      border-color: #555;
      transform: translateY(-2px);
    }
    
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #333;
    }
    
    .widget-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .time-widget {
      grid-column: span 2;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    
    .time {
      font-size: 4rem;
      font-weight: 300;
      margin-bottom: 8px;
    }
    
    .date {
      font-size: 1.5rem;
      opacity: 0.9;
    }
    
    .greeting {
      font-size: 1.2rem;
      margin-bottom: 16px;
      opacity: 0.8;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .action-btn {
      background: #333;
      border: 1px solid #555;
      color: white;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }
    
    .action-btn:hover {
      background: #444;
      transform: translateY(-1px);
    }
    
    .notes-list, .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .note-item, .task-item {
      background: #2a2a2a;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #333;
      font-size: 14px;
    }
    
    .weather-info {
      text-align: center;
    }
    
    .weather-temp {
      font-size: 3rem;
      font-weight: 300;
      margin: 16px 0;
    }
    
    .weather-desc {
      font-size: 1.1rem;
      opacity: 0.8;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    
    .stat-item {
      text-align: center;
      padding: 12px;
      background: #2a2a2a;
      border-radius: 8px;
    }
    
    .stat-number {
      font-size: 2rem;
      font-weight: 600;
      color: #667eea;
    }
    
    .stat-label {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-top: 4px;
    }
    
    .calendar-today {
      font-size: 1.1rem;
      margin-bottom: 16px;
      color: #667eea;
    }
    
    .scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #555 #2a2a2a;
    }
    
    .scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .scrollbar::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    
    .scrollbar::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Time & Greeting Widget -->
    <div class="widget time-widget">
      <div class="greeting" id="greeting">Good morning!</div>
      <div class="time" id="current-time">12:00</div>
      <div class="date" id="current-date">Today</div>
    </div>
    
    <!-- Quick Actions Widget -->
    <div class="widget">
      <div class="widget-header">
        <div class="widget-title">Quick Actions</div>
      </div>
      <div class="widget-content">
        <div class="quick-actions">
          <button class="action-btn" onclick="openFullDashboard()">📊 Full Dashboard</button>
          <button class="action-btn" onclick="newNote()">📝 New Note</button>
          <button class="action-btn" onclick="newTask()">✓ New Task</button>
          <button class="action-btn" onclick="openSettings()">⚙️ Settings</button>
        </div>
      </div>
    </div>
    
    <!-- Notes Widget -->
    <div class="widget">
      <div class="widget-header">
        <div class="widget-title">Recent Notes</div>
      </div>
      <div class="widget-content scrollbar">
        <div class="notes-list" id="notes-list">
          <div class="note-item">Welcome to Bye! 📝</div>
          <div class="note-item">Start organizing your thoughts...</div>
          <div class="note-item">Click 'Full Dashboard' to access all features</div>
        </div>
      </div>
    </div>
    
    <!-- Tasks Widget -->
    <div class="widget">
      <div class="widget-header">
        <div class="widget-title">Today's Tasks</div>
      </div>
      <div class="widget-content scrollbar">
        <div class="tasks-list" id="tasks-list">
          <div class="task-item">✓ Set up Bye dashboard</div>
          <div class="task-item">⭕ Explore features</div>
          <div class="task-item">⭕ Customize your workflow</div>
        </div>
      </div>
    </div>
    
    <!-- Weather Widget -->
    <div class="widget">
      <div class="widget-header">
        <div class="widget-title">Weather</div>
      </div>
      <div class="widget-content">
        <div class="weather-info">
          <div class="weather-temp" id="weather-temp">72°</div>
          <div class="weather-desc" id="weather-desc">Sunny</div>
        </div>
      </div>
    </div>
    
    <!-- Stats Widget -->
    <div class="widget">
      <div class="widget-header">
        <div class="widget-title">Today</div>
      </div>
      <div class="widget-content">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number" id="notes-count">3</div>
            <div class="stat-label">Notes</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" id="tasks-count">3</div>
            <div class="stat-label">Tasks</div>
          </div>
        </div>
        <div class="calendar-today" id="calendar-today">
          No events today
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Update time and date
    function updateTime() {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const dateString = now.toLocaleDateString([], {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
      
      document.getElementById('current-time').textContent = timeString;
      document.getElementById('current-date').textContent = dateString;
      
      // Update greeting
      const hour = now.getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';
      document.getElementById('greeting').textContent = greeting + '!';
    }
    
    // Quick actions
    function openFullDashboard() {
      window.open('http://localhost:3000?skipOnboarding=true&expandAll=true', '_blank');
    }
    
    function newNote() {
      window.open('http://localhost:3000?skipOnboarding=true&action=newNote', '_blank');
    }
    
    function newTask() {
      window.open('http://localhost:3000?skipOnboarding=true&action=newTask', '_blank');
    }
    
    function openSettings() {
      window.open('http://localhost:3000/settings', '_blank');
    }
    
    // Try to load real data from Supabase API
    function loadData() {
      try {
        // Initialize and load from Supabase if available
        // For now, use demo data
        console.log('Extension loaded with demo data');
      } catch (error) {
        console.log('Using offline mode');
      }
    }
    
    // Initialize
    updateTime();
    setInterval(updateTime, 1000);
    loadData();
    
    // Load real weather if geolocation is available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        // Could integrate with weather API here
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(config.outputDir, 'index.html'), indexHtml);

console.log('Extension rebuilt with original bento grid layout!');
console.log('Output directory:', config.outputDir);