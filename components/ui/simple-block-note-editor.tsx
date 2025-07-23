'use client'

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import "./block-note-custom.css"
import { useEffect, useRef, memo } from 'react'
import "./editor-placeholder.css" // Add custom CSS for placeholder styling

interface SimpleBlockNoteEditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
  theme?: "light" | "dark";
  className?: string;
}

// Use memo to prevent unnecessary re-renders
export const SimpleBlockNoteEditor = memo(function SimpleBlockNoteEditor({
  initialContent,
  onChange,
  editable = true,
  theme = "dark",
  className
}: SimpleBlockNoteEditorProps) {
  
  // Track previous content for comparison
  const prevContentRef = useRef<string>(JSON.stringify(initialContent || []));
  const editorChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);
  const editorKey = JSON.stringify(initialContent || []).substring(0, 20); // Use content as key
  
  // Creates a new editor instance with the initial content dependency
  // This ensures a new editor is created when the initialContent changes
  const editor = useCreateBlockNote({
    initialContent: initialContent || undefined,
    domAttributes: {
      editor: {
        class: "editor-with-placeholder" // Add class for placeholder styling
      }
    }
  }, [editorKey]); // Use editorKey to reinitialize when content changes
  
  // Store editor reference
  editorRef.current = editor;
  
  // Log when editor is created/recreated
  useEffect(() => {
    console.log("Editor created/recreated with key:", editorKey);
    
    // On first load, set content
    if (initialContent && editor) {
      try {
        // Reset content to ensure clean state
        console.log("Setting initial content for editor");
        // Only set if different from current content
        const currentContent = JSON.stringify(editor.document || []);
        const newContent = JSON.stringify(initialContent || []);
        if (currentContent !== newContent) {
          console.log("Content differs, updating editor");
          editor.replaceBlocks(editor.document, initialContent);
        }
        prevContentRef.current = newContent;
      } catch (e) {
        console.error("Error setting initial content:", e);
      }
    }
    
    return () => {
      // Clear any pending timeouts when editor is recreated
      if (editorChangeTimeout.current) {
        clearTimeout(editorChangeTimeout.current);
      }
    };
  }, [editor, initialContent, editorKey]);
  
  // Set up onChange handler with debounce
  useEffect(() => {
    if (!editor || !onChange) return;
    
    const handleEditorChange = () => {
      // Capture current content
      const currentEditor = editorRef.current;
      if (!currentEditor) return;
      
      // Don't update during typing - use a longer timeout
      if (editorChangeTimeout.current) {
        clearTimeout(editorChangeTimeout.current);
      }
      
      // Set a significant delay to avoid interrupting typing
      editorChangeTimeout.current = setTimeout(() => {
        const contentStr = JSON.stringify(currentEditor.document || []);
        
        // Only trigger onChange if content has actually changed
        if (contentStr !== prevContentRef.current) {
          console.log("Editor content changed, updating");
          prevContentRef.current = contentStr;
          onChange(currentEditor.document);
        }
      }, 1000); // 1 second debounce
    };
    
    // Register the event handler
    const unsubscribe = editor.onEditorContentChange(handleEditorChange);
    
    // Cleanup function
    return () => {
      // BlockNote API doesn't return an unsubscribe function we can call
      if (editorChangeTimeout.current) {
        clearTimeout(editorChangeTimeout.current);
      }
    };
  }, [editor, onChange]);
  
  // Render the editor with a key to force remounting when content changes
  return (
    <div className={`flex flex-col h-full w-full ${className || ''}`} key={editorKey}>
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