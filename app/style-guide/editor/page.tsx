'use client'

import { useState, useMemo } from 'react'
import type { YooptaContentValue } from '@/types/yoopta'
import { EMPTY_YOO_CONTENT } from '@/types/yoopta'
import { Card } from '@/components/ui/card'
import YooptaEditor, { createYooptaEditor } from '@yoopta/editor'
import {
  Bold,
  Italic,
  Underline,
  Strike,
  CodeMark,
} from '@yoopta/marks'
import Blockquote from '@yoopta/blockquote'
import Code from '@yoopta/code'
import Link from '@yoopta/link'
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings'
import { NumberedList, BulletedList, TodoList } from '@yoopta/lists'

const plugins = [
  Blockquote,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Code,
  Link,
  NumberedList,
  BulletedList,
  TodoList,
]
const marks = [Bold, Italic, Underline, Strike, CodeMark]

export default function EditorStyleGuidePage() {
  const [value, setValue] = useState<YooptaContentValue>(EMPTY_YOO_CONTENT)
  const editor = useMemo(() => createYooptaEditor(), [])

  const handleEditorChange = (newValue: YooptaContentValue, options: any) => {
    setValue(newValue);
  };

  return (
    <div className="p-8 h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Editor Component</h1>
      <Card className="p-4 h-[calc(100vh-200px)]">
        <div className="h-full yoopta-editor-container">
          <YooptaEditor 
            editor={editor}
            value={value} 
            onChange={handleEditorChange} 
            plugins={plugins}
            marks={marks}
            placeholder="This is the editor style guide."
          />
        </div>
      </Card>
    </div>
  )
} 