'use client'

import { useRef, useEffect, useState } from 'react'
import YooptaEditor, { createYooptaEditor, type YooptaContentValue } from '@yoopta/editor'
import { plugins, marks } from '@/lib/editor-config'

const EMPTY_CONTENT: YooptaContentValue = {
  'root': {
    id: 'root',
    type: 'Paragraph',
    value: [
      {
        id: 'element',
        type: 'paragraph',
        children: [{ text: 'Click here and type...' }],
        props: {
          nodeType: 'block',
        },
      },
    ],
    meta: {
      order: 0,
      depth: 0,
    },
  },
}

export function SimpleTestEditor() {
  const [value, setValue] = useState<YooptaContentValue>(EMPTY_CONTENT)
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = createYooptaEditor()
    }
  }, [])

  const handleClick = () => {
    setTimeout(() => {
      const editable = containerRef.current?.querySelector('[contenteditable="true"]')
      if (editable) {
        (editable as HTMLElement).focus()
      }
    }, 10)
  }

  if (!editorRef.current) return <div>Loading...</div>

  return (
    <div 
      ref={containerRef}
      onClick={handleClick}
      className="border p-4 h-64 cursor-text"
      style={{ minHeight: '200px' }}
    >
      <YooptaEditor
        editor={editorRef.current}
        plugins={plugins}
        marks={marks}
        value={value}
        onChange={setValue}
        autoFocus={true}
        className="h-full"
      />
    </div>
  )
} 