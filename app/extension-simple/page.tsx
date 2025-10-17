'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { extensionStorage, type Note, type ScheduleEvent } from '@/lib/extension-storage';
import styles from './extension.module.css';

// Dynamically import Quill to avoid SSR issues
const QuillEditor = dynamic(
  () => import('./quill-editor'),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Loading editor...</div>
  }
);

export default function ExtensionDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [notesData, scheduleData] = await Promise.all([
      extensionStorage.getNotes(),
      extensionStorage.getScheduleEvents()
    ]);

    setNotes(notesData);
    setSchedule(scheduleData);

    // Initialize with sample data if empty
    if (notesData.length === 0 && scheduleData.length === 0) {
      await extensionStorage.initializeWithSampleData();
      loadData(); // Reload after initialization
    }
  };

  const createNewNote = async () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: { ops: [{ insert: '\n' }] }, // Quill Delta format
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await extensionStorage.saveNote(newNote);
    await loadData();
    setSelectedNoteId(newNote.id);
    setIsCreatingNote(false);
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedNote = {
      ...note,
      ...updates,
      updated_at: new Date().toISOString()
    };

    await extensionStorage.saveNote(updatedNote);
    await loadData();
  };

  const deleteNote = async (noteId: string) => {
    await extensionStorage.deleteNote(noteId);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    await loadData();
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className={styles.dashboard}>
      {/* Notes Widget */}
      <div className={styles.notesWidget}>
        <div className={styles.widgetHeader}>
          <h2 className={styles.widgetTitle}>Notes</h2>
          <button
            className={styles.addButton}
            onClick={createNewNote}
            aria-label="Add new note"
          >
            +
          </button>
        </div>

        <div className={styles.notesContainer}>
          {/* Notes List */}
          <div className={styles.notesList}>
            {notes.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No notes yet</p>
                <button
                  className={styles.createFirstButton}
                  onClick={createNewNote}
                >
                  Create your first note
                </button>
              </div>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  className={`${styles.noteItem} ${selectedNoteId === note.id ? styles.selected : ''}`}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <div className={styles.noteTitle}>{note.title || 'Untitled'}</div>
                  <div className={styles.noteDate}>
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Note Editor */}
          <div className={styles.noteEditor}>
            {selectedNote ? (
              <>
                <input
                  type="text"
                  className={styles.noteTitleInput}
                  value={selectedNote.title}
                  onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                  placeholder="Note title..."
                />
                <QuillEditor
                  value={selectedNote.content}
                  onChange={(content) => updateNote(selectedNote.id, { content })}
                />
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteNote(selectedNote.id)}
                >
                  Delete Note
                </button>
              </>
            ) : (
              <div className={styles.noNoteSelected}>
                Select a note to edit or create a new one
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Widget */}
      <div className={styles.scheduleWidget}>
        <div className={styles.widgetHeader}>
          <h2 className={styles.widgetTitle}>Schedule</h2>
        </div>

        <div className={styles.scheduleContent}>
          {schedule.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No events scheduled</p>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {schedule.map(event => {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);

                return (
                  <div key={event.id} className={styles.eventItem}>
                    <div className={styles.eventTime}>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={styles.eventTitle}>{event.title}</div>
                    {event.location && (
                      <div className={styles.eventLocation}>{event.location}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}