'use client'

import { useState, useMemo } from 'react'
import type { Note } from '@/shared/schema'
import { Card } from '@/components/ui/card'
import { AddButton } from '@/components/ui/add-button'
import { NoteList } from './note-list'
import { NoteContent } from './note-content'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { cn } from '@/lib/utils'

const MOCK_NOTES: Note[] = [
  {
    id: 1,
    userId: 1,
    title: 'First Note',
    content: { message: 'This is the content of the first note.' },
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    title: 'Second Note',
    content: { message: 'This is the content of the second note.' },
    updatedAt: new Date(),
  },
  {
    id: 3,
    userId: 1,
    title: 'A much longer title for a note to test truncation',
    content: { message: 'This is the content of the third note.' },
    updatedAt: new Date(),
  },
]

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(
    notes[0]?.id ?? null
  )
   const [isCollapsed, setIsCollapsed] = useState(false)

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  )

  function handleAddNote() {
    // TODO: Implement note creation
    console.log('Add new note')
  }

  return (
    <Card className="h-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel
            collapsible
            collapsedSize={4}
            minSize={15}
            defaultSize={33}
            onCollapse={() => setIsCollapsed(true)}
            onExpand={() => setIsCollapsed(false)}
            className={cn("transition-all duration-300 ease-in-out", isCollapsed ? 'min-w-[56px]' : 'min-w-[200px]')}
        >
            <div className="h-full flex flex-col">
                <div className={cn("p-2 border-b flex items-center justify-between", isCollapsed && "justify-center")}>
                    {!isCollapsed && <h2 className="text-lg font-semibold">Notes</h2>}
                    <AddButton onClick={handleAddNote} />
                </div>
                <div className="flex-grow overflow-y-auto">
                    <NoteList
                        notes={notes}
                        selectedNoteId={selectedNoteId}
                        onSelectNote={setSelectedNoteId}
                        isCollapsed={isCollapsed}
                    />
                </div>
            </div>
        </Panel>
        <PanelResizeHandle className="group w-4 bg-transparent flex items-center justify-center">
            <div className="w-px h-full bg-neutral-800 group-hover:bg-white transition-colors" />
        </PanelResizeHandle>
        <Panel>
             <NoteContent note={selectedNote} />
        </Panel>
      </PanelGroup>
    </Card>
  )
} 