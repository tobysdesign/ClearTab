'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import './block-note-custom.css'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Bot, CheckSquare } from 'lucide-react'
import styles from './block-note-editor.module.css'

interface BlockNoteEditorProps {
  value?: any
  onChange?: (value: any) => void
  editable?: boolean
  placeholder?: string
  onSelectionChange?: (selectedText: string) => void
  onBlur?: () => void
  onAskAI?: (selectedText: string) => void
  onCreateTask?: (selectedText: string) => void
}

export function BlockNoteEditor({
  value,
  onChange,
  editable = true,
  placeholder = 'Start writing...',
  onSelectionChange,
  onBlur,
  onAskAI,
  onCreateTask
}: BlockNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [internalContent, setInternalContent] = useState('')
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState('')
  const isContentChanging = useRef(false)
  
  // Initialize content from value prop
  useEffect(() => {
    if (!isContentChanging.current) {
      try {
        let textContent = '';
        
        if (value === null || value === undefined) {
          textContent = '';
        } else if (typeof value === 'string') {
          textContent = value;
        } else if (typeof value === 'object') {
          // Try to extract text from content object
          textContent = extractTextFromContent(value);
        } else {
          textContent = String(value);
        }
        
        setInternalContent(textContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = textContent;
        }
      } catch (error) {
        console.error("Error setting content:", error);
      }
    }
    
    // Reset the flag after content is updated
    isContentChanging.current = false;
  }, [value]);
  
  // Extract text from structured content
  function extractTextFromContent(content: any): string {
    try {
      if (!content) return '';
      
      // If it's a string, return it directly
      if (typeof content === 'string') return content;
      
      // If it's a Yoopta-style content object
      if (typeof content === 'object') {
        // Try to extract text from children
        let extractedText = '';
        
        // Handle different content formats
        if (content.children && Array.isArray(content.children)) {
          // Simple array of children
          extractedText = content.children
            .map((child: any) => typeof child === 'string' ? child : (child.text || ''))
            .join('');
        } else if (content['paragraph-1'] && content['paragraph-1'].value) {
          // Structured content with paragraph blocks
          Object.values(content).forEach((block: any) => {
            if (block.value && Array.isArray(block.value)) {
              block.value.forEach((element: any) => {
                if (element.children) {
                  element.children.forEach((child: any) => {
                    extractedText += typeof child === 'string' ? child : (child.text || '');
                  });
                }
              });
              extractedText += '\n';
            }
          });
        } else if (content.text) {
          // Simple text object
          extractedText = content.text;
        }
        
        return extractedText || '';
      }
      
      // Fallback
      return String(content);
    } catch (error) {
      console.error("Error extracting text:", error);
      return '';
    }
  }
  
  // Handle selection changes
  useEffect(() => {
    if (!onSelectionChange) return;
    
    const handleSelectionUpdate = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        onSelectionChange('');
        setSelectedText('');
        setShowToolbar(false);
        return;
      }
      
      // Check if selection is within our editor
      const editorElement = editorRef.current;
      if (!editorElement) return;
      
      let node = selection.anchorNode;
      let isInEditor = false;
      
      while (node) {
        if (node === editorElement) {
          isInEditor = true;
          break;
        }
        node = node.parentNode;
      }
      
      if (!isInEditor) {
        onSelectionChange('');
        setSelectedText('');
        setShowToolbar(false);
        return;
      }
      
      // Get selected text
      const selectedText = selection.toString();
      
      // Only show toolbar if there's actual text selected
      if (selectedText.trim()) {
        setSelectedText(selectedText);
        onSelectionChange(selectedText);
        
        // Position the toolbar above the selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (toolbarRef.current) {
          const toolbarHeight = toolbarRef.current.offsetHeight;
          const editorRect = editorElement.getBoundingClientRect();
          
          setToolbarPosition({
            top: rect.top - editorRect.top - toolbarHeight - 10,
            left: rect.left - editorRect.left + (rect.width / 2)
          });
          
          setShowToolbar(true);
        }
      } else {
        setShowToolbar(false);
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionUpdate);
    return () => document.removeEventListener('selectionchange', handleSelectionUpdate);
  }, [onSelectionChange]);
  
  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    
    const newContent = editorRef.current.innerText;
    setInternalContent(newContent);
    
    if (onChange) {
      // Set flag to prevent content overwrite during the next render
      isContentChanging.current = true;
      onChange(newContent);
    }
  }, [onChange]);
  
  // Handle blur event
  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur();
    }
  }, [onBlur]);
  
  // Formatting commands
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    
    // Update content after formatting
    if (editorRef.current) {
      const newContent = editorRef.current.innerText;
      setInternalContent(newContent);
      
      if (onChange) {
        onChange(newContent);
      }
    }
  }, [onChange]);
  
  // Handle Ask AI button
  const handleAskAI = useCallback(() => {
    if (onAskAI && selectedText) {
      onAskAI(selectedText);
      setShowToolbar(false);
    }
  }, [onAskAI, selectedText]);
  
  // Handle Create Task button
  const handleCreateTask = useCallback(() => {
    if (onCreateTask && selectedText) {
      onCreateTask(selectedText);
      setShowToolbar(false);
    }
  }, [onCreateTask, selectedText]);
  
  return (
    <div className={styles.container}>
      <div
        ref={editorRef}
        contentEditable={editable}
        className={styles.editorContent}
        onInput={handleInput}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        style={{
          position: 'relative',
          whiteSpace: 'pre-wrap',
        }}
      />
      
      {/* Floating formatting toolbar */}
      {showToolbar && (
        <div 
          ref={toolbarRef}
          className={styles.toolbar}
          style={{ 
            top: Math.max(0, toolbarPosition.top),
            left: toolbarPosition.left,
            transform: 'translateX(-50%)'
          }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('bold')}
          >
            <Bold className={styles.iconSmall} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('italic')}
          >
            <Italic className={styles.iconSmall} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('underline')}
          >
            <Underline className={styles.iconSmall} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('formatBlock', '<h1>')}
          >
            <Type className={styles.iconSmall} />
          </Button>
          <div className={styles.toolbarDivider} />
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('justifyLeft')}
          >
            <AlignLeft className={styles.iconSmall} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('justifyCenter')}
          >
            <AlignCenter className={styles.iconSmall} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.toolButton} 
            onClick={() => executeCommand('justifyRight')}
          >
            <AlignRight className={styles.iconSmall} />
          </Button>
          <div className={styles.toolbarDivider} />
          {onAskAI && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs flex items-center gap-1" 
              onClick={handleAskAI}
            >
              <Bot className={styles.iconTiny} />
              <span>Ask AI</span>
            </Button>
          )}
          {onCreateTask && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs flex items-center gap-1" 
              onClick={handleCreateTask}
            >
              <CheckSquare className={styles.iconTiny} />
              <span>Create Task</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 