'use client'

import { useState, useMemo, useEffect } from 'react'
import { Note } from '@/shared/schema'
import { NoteList } from './note-list'
import { NoteContent } from './note-content'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Card } from '@/components/ui/card'
import { AddButton } from '@/components/ui/add-button'
import { useNotes } from '@/hooks/use-notes'
import { ListHeader } from '@/components/ui/list-header'
import { cn } from '@/lib/utils'
import { YooptaContentValue, YooptaOnChangeOptions, EMPTY_CONTENT } from '@/types/yoopta'

export function NotesView({ searchQuery }: { searchQuery: string }) {
  const { notes, isLoadingNotes, createNote, updateNote } = useNotes()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isNewNote, setIsNewNote] = useState(false)

  console.log("Notes from useNotes:", notes)

  // Auto-select the first note if one exists and none is selected
  useEffect(() => {
    if (!selectedNoteId && notes && notes.length > 0) {
      const sortedNotes = [...notes].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      setSelectedNoteId(sortedNotes[0].id)
    }
  }, [notes, selectedNoteId])

  const filteredNotes = useMemo(() => {
    if (!notes) return []
    const sortedNotes = [...notes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    if (!searchQuery) return sortedNotes
    return sortedNotes.filter(note => {
      const query = searchQuery.toLowerCase()
      const titleMatch = note.title?.toLowerCase().includes(query)
      const contentString =
        note.content && typeof note.content === 'object'
          ? JSON.stringify(note.content)
          : String(note.content || '')
      const contentMatch = contentString.toLowerCase().includes(query)
      return titleMatch || contentMatch
    })
  }, [notes, searchQuery])

  const selectedNote = useMemo(() => {
    if (selectedNoteId === 'new') return null
    return filteredNotes.find(n => n.id === selectedNoteId) ?? null
  }, [filteredNotes, selectedNoteId])

  console.log("Selected Note:", selectedNote)

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId)
    setIsNewNote(false)
  }

  const handleAddNote = async () => {
    try {
      const newNote = await createNote.mutateAsync({
        title: 'Untitled Note',
        content: EMPTY_CONTENT,
      })
      setSelectedNoteId(newNote.id)
      setIsNewNote(true)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const handleTitleChange = (title: string) => {
    if (selectedNote) {
      updateNote.mutate({ id: selectedNote.id, title })
    }
  }

  const handleContentChange = (content: YooptaContentValue, options: YooptaOnChangeOptions) => {
    if (selectedNote) {
      updateNote.mutate({ id: selectedNote.id, content })
    }
  }

  return (
    <Card className="h-full flex flex-col border overflow-hidden">
      <PanelGroup direction="horizontal" className="flex-grow">
        <Panel
          defaultSize={30}
          minSize={15}
          maxSize={40}
          collapsible
          collapsedSize={8}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          className={cn('flex flex-col', isCollapsed && 'min-w-[50px]')}
        >
          <ListHeader title={isCollapsed ? 'N' : 'Notes'} className="flex flex-row gap-1">
            <AddButton 
              tooltip="Add New Note" 
              onClick={handleAddNote}
              disabled={createNote.isPending}
            />
          </ListHeader>
          <div className="flex-grow p-4 overflow-y-auto">
            <NoteList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              isCollapsed={isCollapsed}
              isSaving={isLoadingNotes}
            />
          </div>
        </Panel>
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
        <Panel defaultSize={70} minSize={30}>
          <div className="h-full flex flex-col">
            {isLoadingNotes ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notes...
              </div>
            ) : (
              <NoteContent
                note={selectedNote}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
                isNewNote={isNewNote}
              />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </Card>
  )
}