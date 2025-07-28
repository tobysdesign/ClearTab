'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { SimpleBlockNoteEditor } from '@/components/ui/simple-block-note-editor'
import { EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema'
import { Block } from '@blocknote/core'

export default function EditorStyleGuidePage() {
  const [value, setValue] = useState<Block[]>(EMPTY_BLOCKNOTE_CONTENT as Block[])

  const handleEditorChange = (content: Block[]) => {
    setValue(content)
  }

  return (
    <div className="p-8 h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Editor Component</h1>
      <Card className="p-4 h-[calc(100vh-200px)]">
        <div className="h-full">
          <SimpleBlockNoteEditor 
            initialContent={value}
            onChange={handleEditorChange} 
            editable={true}
            className="h-full"
          />
        </div>
      </Card>
    </div>
  )
}