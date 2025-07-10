# Bye - Personal Dashboard

A modern, AI-powered personal dashboard and productivity app.

## Features

- Personal dashboard with customizable widgets
- Note-taking with rich text editor
- Task management with due dates and priorities
- Meeting recorder and transcriber
- Weather and calendar integration
- AI assistant for productivity

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/bye.git
cd bye
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

4. Run database migrations
```bash
npm run migrate
```

5. Start the development server
```bash
npm run dev
```

## Chrome Extension

Bye can also be used as a Chrome extension that replaces your new tab page.

### Building the Extension

1. Build the extension
```bash
./scripts/build-extension.sh
```

2. The extension will be built to `dist/extension` and a zip file will be created at `dist/bye-extension.zip`

### Installing the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist/extension` directory

### Features

- Replaces your new tab page with the Bye dashboard
- Quick access to notes, tasks, and meetings from the extension popup
- Works offline with data sync when online
- Seamless integration with the web version

## License

[MIT](LICENSE) 