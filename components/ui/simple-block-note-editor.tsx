'use client'

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import "./block-note-custom.css"
import { useEffect, useRef, memo, useMemo } from 'react'
import "./editor-placeholder.css"

interface SimpleBlockNoteEditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
  theme?: "light" | "dark";
  className?: string;
}

// Default empty content for BlockNote
const DEFAULT_CONTENT = [
  {
    id: "default",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
];

// Validate and normalize content for BlockNote
function validateAndNormalizeContent(content: any): any[] {
  // If content is null, undefined, or empty array, return default
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return DEFAULT_CONTENT;
  }
  
  // If content is not an array, return default
  if (!Array.isArray(content)) {
    return DEFAULT_CONTENT;
  }
  
  // If content is a valid non-empty array, return as-is
  return content;
}

export const SimpleBlockNoteEditor = memo(function SimpleBlockNoteEditor({
  initialContent,
  onChange,
  editable = true,
  theme = "dark",
  className
}: SimpleBlockNoteEditorProps) {
  
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  
  // Memoize the validated content to prevent unnecessary re-creates
  const validatedContent = useMemo(() => {
    return validateAndNormalizeContent(initialContent);
  }, [initialContent]);
  
  // Create editor with stable content
  const editor = useCreateBlockNote({
    initialContent: validatedContent,
    domAttributes: {
      editor: {
        class: "editor-with-placeholder"
      }
    }
  });
  
  // Handle content changes with proper debouncing
  useEffect(() => {
    if (!editor || !onChange) return;
    
    const handleChange = () => {
      // Prevent recursive updates
      if (isUpdatingRef.current) return;
      
      // Clear existing timeout
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      
      // Debounce the onChange call
      changeTimeoutRef.current = setTimeout(() => {
        try {
          const content = editor.document;
          if (content && Array.isArray(content)) {
            onChange(content);
          }
        } catch (error) {
          console.error('Error getting editor content:', error);
        }
      }, 500); // Reduced to 500ms for better responsiveness
    };
    
    // Subscribe to editor changes
    editor.onEditorContentChange(handleChange);
    
    // Cleanup function
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, [editor, onChange]);
  
  // Update editor content when initialContent changes (but only if significantly different)
  useEffect(() => {
    if (!editor || isUpdatingRef.current) return;
    
    const currentContent = editor.document;
    const newContent = validateAndNormalizeContent(initialContent);
    
    // Only update if content is significantly different
    // Compare stringified versions but be careful about order and formatting
    const currentStr = JSON.stringify(currentContent || []);
    const newStr = JSON.stringify(newContent);
    
    if (currentStr !== newStr && newContent !== DEFAULT_CONTENT) {
      try {
        isUpdatingRef.current = true;
        editor.replaceBlocks(editor.document, newContent);
      } catch (error) {
        console.error('Error updating editor content:', error);
      } finally {
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  }, [editor, validatedContent]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`flex flex-col h-full w-full ${className || ''}`}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme}
        sideMenu={false}
        className="editor-with-custom-placeholder"
      />
    </div>
  );
});