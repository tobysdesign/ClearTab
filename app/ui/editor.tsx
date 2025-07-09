'use client'

import { useState, useEffect } from "react";
import { Editor as BlockNoteEditor } from "@/components/DynamicEditor";

interface EditorProps {
  value?: any;
  onChange?: (value: any) => void;
  readOnly?: boolean;
  onBlur?: () => void;
  placeholder?: string;
  onOpenAiChat?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
}

export default function Editor({ 
  value, 
  onChange, 
  readOnly, 
  onBlur,
  placeholder,
  onOpenAiChat,
  onCreateTask
}: EditorProps) {
  // Convert from the app's content format to BlockNote format if needed
  const [blockNoteContent, setBlockNoteContent] = useState<any>(null);
  
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
  const handleEditorChange = (content: any) => {
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