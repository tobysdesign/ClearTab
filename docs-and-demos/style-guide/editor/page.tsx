'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { EMPTY_QUILL_CONTENT } from '@/shared/schema'
import { Editor } from '@/components/ui/editor'
import type { QuillDelta } from '@/lib/quill-utils'

export default function EditorStyleGuidePage() {
  const [value, setValue] = useState<QuillDelta>(EMPTY_QUILL_CONTENT)

  const handleEditorChange = (content: QuillDelta) => {
    setValue(content)
  }

  return (
    <div className="p-8 h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Editor Component</h1>
      <Card className="p-4 h-[calc(100vh-200px)]">
        <div className="h-full">
          <Editor
            value={value}
            onChange={handleEditorChange}
            editable={true}
            className="h-full"
            placeholder="Start writing in the Quill editor..."
          />
        </div>
      </Card>
    </div>
  )
}