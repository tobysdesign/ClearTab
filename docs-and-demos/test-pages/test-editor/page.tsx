'use client'

import { useState } from 'react'
import { Editor } from '@/components/ui/editor'
import { Button } from '@/components/ui/button'

export default function TestEditorPage() {
  const [content, setContent] = useState<any>(null)
  const [savedContent, setSavedContent] = useState<string>('')
  const [taskCreated, setTaskCreated] = useState(false)
  const [taskText, setTaskText] = useState('')

  const handleSave = () => {
    setSavedContent(JSON.stringify(content, null, 2))
  }
  
  // Handle opening AI chat with selected text
  const handleOpenAiChat = (selectedText: string) => {
    alert(`AI Chat would open with context: "${selectedText}"\n\nIn a real implementation, this would open your AI chat interface.`)
  }
  
  // Handle creating a task with selected text
  const handleCreateTask = (selectedText: string) => {
    setTaskCreated(true)
    setTaskText(selectedText)
    
    // In a real implementation, this would call the API to create a task
    setTimeout(() => {
      alert(`Task created successfully with content: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`)
    }, 500)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Simple Editor with Task Integration</h1>
      
      <div className="grid gap-8">
        <div className="border border-border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Try selecting text and using the "Create Task" button that appears.
          </p>
          <div className="min-h-[400px] relative">
            <Editor 
              value={content}
              onChange={setContent}
              className="min-h-[400px]"
              onOpenAiChat={handleOpenAiChat}
              onCreateTask={handleCreateTask}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave}>Save Content</Button>
          </div>
        </div>
        
        {taskCreated && (
          <div className="border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Task Created</h2>
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">Task content:</p>
              <p className="mt-2 whitespace-pre-wrap">{taskText}</p>
            </div>
          </div>
        )}
        
        {savedContent && (
          <div className="border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Saved Content</h2>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
              {savedContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 