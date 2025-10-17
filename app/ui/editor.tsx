'use client'

import { useState, useEffect } from "react";
import { Editor as BlockNoteEditor } from "@/components/DynamicEditor";

// Define types for editor content
type EditorContent = Record<string, unknown> | null;

interface EditorProps {
  value?: EditorContent;
  onChange?: (value: EditorContent) => void;
  readOnly?: boolean;
  _onBlur?: () => void; // Prefixed with _ to indicate unused
  _placeholder?: string; // Prefixed with _ to indicate unused
  onOpenAiChat?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
}

export default function Editor({
  value,
  onChange,
  readOnly,
  _onBlur,
  _placeholder,
  onOpenAiChat,
  onCreateTask
}: EditorProps) {
  // Convert from the app's content format to BlockNote format if needed
  const [blockNoteContent, setBlockNoteContent] = useState<EditorContent>(null);
  
  // Initialize BlockNote content from value
  useEffect(() => {
    if (value) {
      try {
        // This is a simple conversion - you may need to adapt this based on your content structure
        setBlockNoteContent(value);
      } catch (error) {
        console.error("Error converting content for BlockNote:", error);
        setBlockNoteContent(null);
      }
    }
  }, [value]);

  // Handle content changes from BlockNote
  const handleEditorChange = (content: EditorContent) => {
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <BlockNoteEditor 
      initialContent={blockNoteContent} 
      onChange={handleEditorChange}
      readOnly={readOnly}
      onOpenAiChat={onOpenAiChat}
      onCreateTask={onCreateTask}
    />
  );
} 