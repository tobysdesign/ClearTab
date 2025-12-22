const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  outputDir: path.join(__dirname, "../dist/extension"),
  nextBuildDir: path.join(__dirname, "../.next/static"),
  publicDir: path.join(__dirname, "../public"),
  nextServerDir: path.join(__dirname, "../.next/server/app"),
  extensionFiles: [
    "manifest.json",
    "background.js",
    "popup.html",
    "popup.js",
    "icons",
  ],
};

console.log("Building simple Chrome extension...");

// Create output directory
if (fs.existsSync(config.outputDir)) {
  fs.rmSync(config.outputDir, { recursive: true });
}
fs.mkdirSync(config.outputDir, { recursive: true });

// Copy static assets from Next.js build
console.log("Copying Next.js static assets...");
if (fs.existsSync(config.nextBuildDir)) {
  const destStaticDir = path.join(config.outputDir, "static");
  fs.mkdirSync(destStaticDir, { recursive: true });
  fs.cpSync(config.nextBuildDir, destStaticDir, { recursive: true });
}

// Copy extension files from public directory
console.log("Copying extension files...");
config.extensionFiles.forEach((file) => {
  const src = path.join(config.publicDir, file);
  const dest = path.join(config.outputDir, file);

  try {
    if (fs.existsSync(src)) {
      if (fs.lstatSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    } else {
      console.warn(`Warning: File not found: ${src}`);
    }
  } catch (error) {
    console.error(`Error copying ${file}:`, error);
  }
});

// Copy shared API client to extension
console.log("Copying shared API client...");
const sharedApiPath = path.join(__dirname, "../shared/api-client.ts");
const extensionApiPath = path.join(config.outputDir, "shared-api.js");

if (fs.existsSync(sharedApiPath)) {
  // Convert TypeScript to JavaScript and update for extension use
  let apiContent = fs.readFileSync(sharedApiPath, "utf8");

  // Remove TypeScript types and imports for browser compatibility
  apiContent = apiContent
    .replace(/import.*from.*[\'"@supabase\/supabase-js['"];?\n/g, "")
    .replace(/export interface.*?\{[^}]*\}/gs, "")
    .replace(/: [A-Za-z\[\]<>|{}., ]+/g, "")
    .replace(/Promise<[^>]+>/g, "Promise")
    .replace("export class", "window.SharedApiClient = class")
    .replace(
      "export function createApiClient",
      "window.createApiClient = function createApiClient",
    )
    .replace(
      "YOUR_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://qclvzjiyglvxtctauyhb.supabase.co",
    )
    .replace(
      "YOUR_SUPABASE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbHZ6aml5Z2x2eHRjdGF1eWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Nzg4ODUsImV4cCI6MjA2NTU1NDg4NX0.xOL9yscpojoA2DiybM8EPt9a9wqpbbXs6ZxNjt2WpI8",
    );

  fs.writeFileSync(extensionApiPath, apiContent);
}

// Create widget-based extension dashboard to match web app
console.log("Creating widget-based extension dashboard...");
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

    .header {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: white;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
    }

    .sidebar {
      background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
      border-radius: 12px;
      border: 1px solid #333;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
      border-radius: 12px;
      border: 1px solid #333;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .widget-header {
      padding: 16px 20px;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .widget-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }

    .widget-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .list-item {
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .list-item:hover {
      border-color: #5a5a5a;
      background: #333;
    }

    .list-item.active {
      border-color: #667eea;
      background: #1a1a2e;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .task-checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #5a5a5a;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .task-checkbox.completed {
      background: #667eea;
      border-color: #667eea;
    }

    .task-text {
      flex: 1;
    }

    .task-text.completed {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .btn {
      background: #333;
      border: 1px solid #5a5a5a;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .btn:hover {
      background: #444;
    }

    .btn-primary {
      background: #667eea;
      border-color: #667eea;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .editor-container {
      background: #1a1a1a;
      border-radius: 8px;
      min-height: 400px;
    }

    .ce-block__content,
    .ce-toolbar__content {
      max-width: none !important;
    }

    .codex-editor {
      color: #fff !important;
    }

    .ce-block {
      color: #fff;
    }

    .scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #5a5a5a #2a2a2a;
    }

    .scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .scrollbar::-webkit-scrollbar-track {
      background: #2a2a2a;
    }

    .scrollbar::-webkit-scrollbar-thumb {
      background: #5a5a5a;
      border-radius: 3px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #999;
    }

    .input {
      width: 100%;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 8px 12px;
      color: white;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .input:focus {
      outline: none;
      border-color: #667eea;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
    }

    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Header -->
    <div class="header">
      <div class="logo">Bye Dashboard</div>
      <div class="user-info">
        <span id="user-name">Loading...</span>
        <button class="btn" onclick="logout()">Logout</button>
      </div>
    </div>

    <!-- Notes Sidebar -->
    <div class="sidebar">
      <div class="widget-header">
        <div class="widget-title">Notes</div>
        <button class="btn btn-primary" onclick="createNewNote()">+ New</button>
      </div>
      <div class="widget-content scrollbar">
        <div id="notes-list" class="loading">Loading notes...</div>
      </div>
    </div>

    <!-- Main Editor -->
    <div class="main-content">
      <div class="widget-header">
        <input type="text" id="note-title" class="input" placeholder="Note title..." style="border: none; background: transparent; font-size: 18px; font-weight: 600;">
        <div>
          <button class="btn" onclick="saveCurrentNote()">Save</button>
          <button class="btn" onclick="deleteCurrentNote()">Delete</button>
        </div>
      </div>
      <div class="widget-content">
        <div id="editor-container" class="editor-container"></div>
      </div>
    </div>

    <!-- Tasks Sidebar -->
    <div class="sidebar">
      <div class="widget-header">
        <div class="widget-title">Tasks</div>
        <button class="btn btn-primary" onclick="createNewTask()">+ Add</button>
      </div>
      <div class="widget-content scrollbar">
        <div id="tasks-list" class="loading">Loading tasks...</div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <div id="task-modal" class="modal hidden">
    <div class="modal-content">
      <h3>New Task</h3>
      <input type="text" id="task-title-input" class="input" placeholder="Task title...">
      <textarea id="task-description-input" class="input" placeholder="Description..." rows="3"></textarea>
      <div style="display: flex; gap: 12px; margin-top: 16px;">
        <button class="btn btn-primary" onclick="saveNewTask()">Save</button>
        <button class="btn" onclick="closeTaskModal()">Cancel</button>
      </div>
    </div>
  </div>

  <script>
    // Global state
    let apiClient;
    let currentUser;
    let currentNote = null;
    let editor = null;
    let notes = [];
    let tasks = [];

    // Initialize app
    async function initializeApp() {
      try {
        // Initialize API client
        apiClient = window.createApiClient({
          supabaseUrl: '${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qclvzjiyglvxtctauyhb.supabase.co"}',
          supabaseKey: '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbHZ6aml5Z2x2eHRjdGF1eWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Nzg4ODUsImV4cCI6MjA2NTU1NDg4NX0.xOL9yscpojoA2DiybM8EPt9a9wqpbbXs6ZxNjt2WpI8"}',
          isExtension: true
        });

        // Check authentication
        const { user, error } = await apiClient.getCurrentUser();
        if (error || !user) {
          await handleLogin();
          return;
        }

        currentUser = user;
        document.getElementById('user-name').textContent = user.email || 'User';

        // Initialize editor
        initializeEditor();

        // Load data
        await loadNotes();
        await loadTasks();

      } catch (error) {
        console.error('Initialization error:', error);
        document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 16px;"><h2>Connection Error</h2><p>Unable to connect to the server. Please check your internet connection.</p><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>';
      }
    }

    async function handleLogin() {
      try {
        await apiClient.signInWithGoogle();
        // Reload after auth
        setTimeout(() => location.reload(), 1000);
      } catch (error) {
        console.error('Login error:', error);
      }
    }

    function initializeEditor() {
      editor = new EditorJS({
        holder: 'editor-container',
        placeholder: 'Start writing your note...',
        tools: {
          header: {
            class: Header,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true
          },
          quote: {
            class: Quote,
            inlineToolbar: true
          },
          code: CodeTool,
          paragraph: {
            class: Paragraph,
            inlineToolbar: true
          }
        },
        onChange: async () => {
          if (currentNote) {
            // Auto-save after 1 second of inactivity
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(saveCurrentNote, 1000);
          }
        }
      });
    }

    async function loadNotes() {
      try {
        notes = await apiClient.getNotes(currentUser.id);
        renderNotesList();

        // Select first note if available
        if (notes.length > 0 && !currentNote) {
          selectNote(notes[0]);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        document.getElementById('notes-list').innerHTML = '<div style="color: #999;">Error loading notes</div>';
      }
    }

    async function loadTasks() {
      try {
        tasks = await apiClient.getTasks(currentUser.id);
        renderTasksList();
      } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('tasks-list').innerHTML = '<div style="color: #999;">Error loading tasks</div>';
      }
    }

    function renderNotesList() {
      const notesList = document.getElementById('notes-list');

      if (notes.length === 0) {
        notesList.innerHTML = '<div style="color: #999; text-align: center;">No notes yet</div>';
        return;
      }

      notesList.innerHTML = notes.map(note => \`
        <div class="list-item \${currentNote?.id === note.id ? 'active' : ''}" onclick="selectNote(\${JSON.stringify(note).replace(/"/g, '&quot;')})">
          <div style="font-weight: 500;">\${note.title || 'Untitled'}</div>
          <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">
            \${new Date(note.updated_at || note.created_at).toLocaleDateString()}
          </div>
        </div>
      \`).join('');
    }

    function renderTasksList() {
      const tasksList = document.getElementById('tasks-list');

      if (tasks.length === 0) {
        tasksList.innerHTML = '<div style="color: #999; text-align: center;">No tasks yet</div>';
        return;
      }

      tasksList.innerHTML = tasks.map(task => \`
        <div class="task-item">
          <div class="task-checkbox \${task.completed ? 'completed' : ''}" onclick="toggleTask('\${task.id}')">
            \${task.completed ? '✓' : ''}
          </div>
          <div class="task-text \${task.completed ? 'completed' : ''}">
            \${task.title}
          </div>
        </div>
      \`).join('');
    }

    async function selectNote(note) {
      currentNote = note;
      document.getElementById('note-title').value = note.title || '';

      try {
        if (note.content) {
          await editor.render(note.content);
        } else {
          await editor.clear();
        }
      } catch (error) {
        console.error('Error loading note content:', error);
      }

      renderNotesList(); // Update active state
    }

    async function createNewNote() {
      const newNote = {
        title: '',
        content: null,
        userId: currentUser.id
      };

      try {
        const savedNote = await apiClient.createNote(newNote);
        notes.unshift(savedNote);
        await selectNote(savedNote);
        renderNotesList();

        // Focus title input
        document.getElementById('note-title').focus();
      } catch (error) {
        console.error('Error creating note:', error);
      }
    }

    async function saveCurrentNote() {
      if (!currentNote) return;

      try {
        const content = await editor.save();
        const title = document.getElementById('note-title').value;

        const updatedNote = await apiClient.updateNote(currentNote.id, {
          title: title,
          content: content
        });

        // Update local state
        const noteIndex = notes.findIndex(n => n.id === currentNote.id);
        if (noteIndex !== -1) {
          notes[noteIndex] = updatedNote;
          currentNote = updatedNote;
        }

        renderNotesList();
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }

    async function deleteCurrentNote() {
      if (!currentNote || !confirm('Delete this note?')) return;

      try {
        await apiClient.deleteNote(currentNote.id);
        notes = notes.filter(n => n.id !== currentNote.id);

        // Select next note or clear editor
        if (notes.length > 0) {
          await selectNote(notes[0]);
        } else {
          currentNote = null;
          document.getElementById('note-title').value = '';
          await editor.clear();
        }

        renderNotesList();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }

    function createNewTask() {
      document.getElementById('task-modal').classList.remove('hidden');
      document.getElementById('task-title-input').focus();
    }

    function closeTaskModal() {
      document.getElementById('task-modal').classList.add('hidden');
      document.getElementById('task-title-input').value = '';
      document.getElementById('task-description-input').value = '';
    }

    async function saveNewTask() {
      const title = document.getElementById('task-title-input').value.trim();
      if (!title) return;

      const newTask = {
        title: title,
        description: document.getElementById('task-description-input').value.trim(),
        completed: false,
        priority: 'medium',
        userId: currentUser.id
      };

      try {
        const savedTask = await apiClient.createTask(newTask);
        tasks.unshift(savedTask);
        renderTasksList();
        closeTaskModal();
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }

    async function toggleTask(taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      try {
        const updatedTask = await apiClient.updateTask(taskId, {
          completed: !task.completed
        });

        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          tasks[taskIndex] = updatedTask;
        }

        renderTasksList();
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }

    async function logout() {
      try {
        await apiClient.signOut();
        location.reload();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Handle title changes
    document.getElementById('note-title').addEventListener('input', () => {
      if (currentNote) {
        clearTimeout(window.titleSaveTimeout);
        window.titleSaveTimeout = setTimeout(saveCurrentNote, 1000);
      }
    });

    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', initializeApp);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(config.outputDir, "index.html"), indexHtml);

console.log("Extension build complete!");
console.log(`Output directory: ${config.outputDir}`);
console.log("To test the extension:");
console.log("1. Open Chrome and navigate to chrome://extensions");
console.log('2. Enable "Developer mode"');
console.log(
  `3. Click "Load unpacked" and select the directory: ${config.outputDir}`,
);
