'use client'

import { useState, useEffect } from 'react'

interface SimpleEditorProps {
  value?: any
  onChange?: (value: any) => void
  placeholder?: string
}

export function SimpleEditor({ value, onChange, placeholder = 'Start writing...' }: SimpleEditorProps) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (value && typeof value === 'object') {
      // Extract text from Yoopta format
      try {
        const blocks = Object.values(value)
        const extractedText = blocks
          .map((block: any) => {
            if (block?.value?.[0]?.children?.[0]?.text) {
              return block.value[0].children[0].text
            }
            return ''
          })
          .join('\n')
        setText(extractedText)
      } catch {
        setText('')
      }
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    
    // Convert to Yoopta format
    const yooptaValue = {
      'root': {
        id: 'root',
        type: 'paragraph',
        value: [{
          id: 'paragraph',
          type: 'paragraph',
          children: [{ text: newText }],
          props: { nodeType: 'block' },
        }],
        meta: { order: 0, depth: 0 },
      },
    }
    
    onChange?.(yooptaValue)
  }

  return (
    <textarea
      value={text}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full h-full min-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  )
} 