'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { YooptaContentValue } from '@yoopta/editor'

interface EditorProps {
  value?: YooptaContentValue
  onChange?: (value: YooptaContentValue) => void
  editable?: boolean
  className?: string
  placeholder?: string
}

export function Editor({
  value,
  onChange,
  editable = true, 
  className,
  placeholder = 'Start writing...'
}: EditorProps) {
  const [textContent, setTextContent] = useState('')

  // Extract text from Yoopta format when value changes
  useEffect(() => {
    if (value && typeof value === 'object') {
      try {
        const blocks = Object.values(value)
        const text = blocks
          .map((block: any) => {
            if (block?.value?.[0]?.children?.[0]?.text) {
              return block.value[0].children[0].text
            }
            return ''
          })
          .join('\n')
        setTextContent(text || '')
      } catch (error) {
        console.error('Error parsing content:', error)
        setTextContent('')
      }
    } else {
      setTextContent('')
    }
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setTextContent(newText)
    
    // Convert back to Yoopta format
    const yooptaValue: YooptaContentValue = {
      'root': {
        id: 'root',
        type: 'paragraph',
        value: [{
          id: 'paragraph',
          type: 'paragraph',
          children: [{ text: newText }],
          props: {
            nodeType: 'block',
          },
        }],
        meta: {
          order: 0,
          depth: 0,
        },
      },
    }
    
    onChange?.(yooptaValue)
  }

  return (
    <div className={cn('relative min-h-[200px] w-full', className)}>
      <textarea
        value={textContent}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={!editable}
        className={cn(
          'w-full h-full min-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        )}
      />
    </div>
  )
} 