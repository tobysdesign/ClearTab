// Chrome Storage API wrapper for extension
// Provides a simple interface for storing and retrieving data in Chrome extension

export interface Note {
  id: string;
  title: string;
  content: any; // Quill Delta content
  created_at: string;
  updated_at: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}

class ExtensionStorage {
  // Notes methods
  async getNotes(): Promise<Note[]> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['notes'], (result) => {
          resolve(result.notes || []);
        });
      } else {
        // Fallback to localStorage for development
        const notes = localStorage.getItem('ext_notes');
        resolve(notes ? JSON.parse(notes) : []);
      }
    });
  }

  async saveNote(note: Note): Promise<void> {
    const notes = await this.getNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);

    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ notes }, () => resolve());
      } else {
        localStorage.setItem('ext_notes', JSON.stringify(notes));
        resolve();
      }
    });
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== id);

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ notes: filtered }, () => resolve());
      } else {
        localStorage.setItem('ext_notes', JSON.stringify(filtered));
        resolve();
      }
    });
  }

  // Schedule methods
  async getScheduleEvents(): Promise<ScheduleEvent[]> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['schedule'], (result) => {
          resolve(result.schedule || []);
        });
      } else {
        const schedule = localStorage.getItem('ext_schedule');
        resolve(schedule ? JSON.parse(schedule) : []);
      }
    });
  }

  async saveScheduleEvent(event: ScheduleEvent): Promise<void> {
    const events = await this.getScheduleEvents();
    const existingIndex = events.findIndex(e => e.id === event.id);

    if (existingIndex >= 0) {
      events[existingIndex] = event;
    } else {
      events.push(event);
    }

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ schedule: events }, () => resolve());
      } else {
        localStorage.setItem('ext_schedule', JSON.stringify(events));
        resolve();
      }
    });
  }

  async deleteScheduleEvent(id: string): Promise<void> {
    const events = await this.getScheduleEvents();
    const filtered = events.filter(e => e.id !== id);

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ schedule: filtered }, () => resolve());
      } else {
        localStorage.setItem('ext_schedule', JSON.stringify(filtered));
        resolve();
      }
    });
  }

  // Add some sample data for first run
  async initializeWithSampleData(): Promise<void> {
    const notes = await this.getNotes();
    if (notes.length === 0) {
      await this.saveNote({
        id: '1',
        title: 'Welcome to your dashboard!',
        content: [
          {
            id: '1',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ type: 'text', text: 'Start taking notes here. All your data is stored locally in your browser.', styles: {} }],
            children: []
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const events = await this.getScheduleEvents();
    if (events.length === 0) {
      const now = new Date();
      await this.saveScheduleEvent({
        id: '1',
        title: 'Sample Event',
        start: new Date(now.getTime() + 3600000).toISOString(), // 1 hour from now
        end: new Date(now.getTime() + 7200000).toISOString(), // 2 hours from now
        description: 'This is a sample event. Add your own events to stay organized!'
      });
    }
  }
}

export const extensionStorage = new ExtensionStorage();