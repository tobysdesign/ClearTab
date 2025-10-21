'use client'

import styles from './notes-widget.module.css'

export function MockNotesWidget() {
  const mockNotes = [
    {
      id: '1',
      title: 'Welcome to ClearTab',
      content: 'This is a demo note showing how your notes will appear...',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Meeting Notes',
      content: 'Remember to follow up on the project timeline discussion...',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      title: 'Ideas',
      content: 'Brainstorm session for Q4 planning...',
      created_at: new Date(Date.now() - 172800000).toISOString(),
    }
  ]

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notes</h2>
        <span className={styles.count}>{mockNotes.length}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.notesList}>
          {mockNotes.map((note) => (
            <div key={note.id} className={styles.noteItem}>
              <div className={styles.noteHeader}>
                <h3 className={styles.noteTitle}>{note.title}</h3>
                <span className={styles.noteDate}>
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className={styles.noteContent}>{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}