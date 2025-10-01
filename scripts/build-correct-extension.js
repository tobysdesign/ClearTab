const fs = require('fs');
const path = require('path');

const config = {
  outputDir: path.join(__dirname, '..', 'dist', 'extension')
};

// Create the correct dashboard HTML that matches the actual web app
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
      grid-template-rows: 1fr 1fr;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 16px;
      height: 100vh;
    }
    
    .top-row {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .bottom-row {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 8px;
    }
    
    .widget {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    
    .widget:hover {
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .widget-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .weather-main {
      text-align: center;
    }
    
    .weather-temp {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 12px 0;
      color: #fff;
    }
    
    .weather-location {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-bottom: 8px;
    }
    
    .weather-condition {
      font-size: 0.85rem;
      opacity: 0.8;
    }
    
    .note-item, .task-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .task-checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
    
    .task-completed {
      background: #4f46e5;
      border-color: #4f46e5;
    }
    
    .recorder-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
    }
    
    .record-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #ef4444;
      border: none;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .record-btn:hover {
      background: #dc2626;
      transform: scale(1.05);
    }
    
    .countdown-display {
      text-align: center;
      padding: 20px;
    }
    
    .countdown-time {
      font-size: 2rem;
      font-weight: 300;
      color: #fff;
      margin: 12px 0;
    }
    
    .countdown-label {
      font-size: 0.9rem;
      opacity: 0.7;
    }
    
    .schedule-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .schedule-time {
      font-size: 0.8rem;
      opacity: 0.7;
      min-width: 60px;
    }
    
    .schedule-event {
      flex: 1;
      font-size: 0.9rem;
    }
    
    .scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }
    
    .scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Top Row: Notes and Tasks -->
    <div class="top-row">
      <!-- Notes Widget -->
      <div class="widget">
        <div class="widget-header">
          <div class="widget-title">Notes</div>
        </div>
        <div class="widget-content scrollbar">
          <div id="notes-list">
            <div class="note-item">Welcome to your dashboard!</div>
            <div class="note-item">Click to add a new note...</div>
          </div>
        </div>
      </div>
      
      <!-- Tasks Widget -->
      <div class="widget">
        <div class="widget-header">
          <div class="widget-title">Tasks</div>
        </div>
        <div class="widget-content scrollbar">
          <div id="tasks-list">
            <div class="task-item">
              <span class="task-checkbox">✓</span>
              Check out the dashboard
            </div>
            <div class="task-item">
              <span class="task-checkbox"></span>
              Add your first task
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Row: Weather, Recorder, Countdown, Schedule -->
    <div class="bottom-row">
      <!-- Weather Widget -->
      <div class="widget">
        <div class="widget-header">
          <div class="widget-title">Weather</div>
        </div>
        <div class="widget-content">
          <div class="weather-main">
            <div class="weather-location">Sydney, NSW</div>
            <div class="weather-temp">28°</div>
            <div class="weather-condition">Cloudy</div>
          </div>
        </div>
      </div>
      
      <!-- Recorder Widget -->
      <div class="widget">
        <div class="widget-header">
          <div class="widget-title">Recorder</div>
        </div>
        <div class="widget-content">
          <div class="recorder-controls">
            <button class="record-btn">●</button>
          </div>
          <div style="text-align: center; font-size: 0.8rem; opacity: 0.7;">
            Click to start recording
          </div>
        </div>
      </div>
      
      <!-- Countdown Widget -->
      <div class="widget">
        <div class="widget-header">
          <div class="widget-title">Countdown</div>
        </div>
        <div class="widget-content">
          <div class="countdown-display">
            <div class="countdown-time">05:00</div>
            <div class="countdown-label">Focus time</div>
          </div>
        </div>
      </div>
      
      <!-- Schedule Widget -->
      <div class="widget">
        <div class="widget-header">
          <div class="widget-title">Schedule</div>
        </div>
        <div class="widget-content scrollbar">
          <div id="schedule-list">
            <div class="schedule-item">
              <div class="schedule-time">9:00</div>
              <div class="schedule-event">Morning standup</div>
            </div>
            <div class="schedule-item">
              <div class="schedule-time">11:00</div>
              <div class="schedule-event">Client call</div>
            </div>
            <div class="schedule-item">
              <div class="schedule-time">14:00</div>
              <div class="schedule-event">Project review</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Basic functionality to make it interactive
    console.log('Dashboard loaded with correct layout!');
    
    // Add any future API integration here
    function loadData() {
      // Will integrate with Supabase API later
    }
    
    loadData();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(config.outputDir, 'index.html'), indexHtml);

console.log('Extension rebuilt with CORRECT layout matching web app!');
console.log('Layout: Top row (Notes | Tasks), Bottom row (Weather | Recorder | Countdown | Schedule)');
console.log('Output directory:', config.outputDir);