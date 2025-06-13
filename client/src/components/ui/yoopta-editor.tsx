import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { createYooptaEditor, YooptaContentValue } from '@yoopta/editor';
const YooptaEditor = require('@yoopta/editor').default;
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import { Bold, Italic, CodeMark, Underline, Strike } from '@yoopta/marks';
import Link from '@yoopta/link';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface YooptaEditorComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export interface YooptaEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
}

const plugins = [
  Paragraph,
  HeadingOne,
  HeadingTwo, 
  HeadingThree,
  Blockquote,
  BulletedList,
  NumberedList,
  TodoList,
  Code,
  Link,
];

// Custom action menu items
const customActionMenuItems = (createTaskFn?: (text: string) => void) => [
  {
    title: 'Text',
    icon: '📝',
    command: 'paragraph',
  },
  {
    title: 'Heading 1',
    icon: 'H1',
    command: 'heading-one',
  },
  {
    title: 'Heading 2', 
    icon: 'H2',
    command: 'heading-two',
  },
  {
    title: 'Heading 3',
    icon: 'H3',
    command: 'heading-three',
  },
  {
    title: 'Bullet List',
    icon: '•',
    command: 'bulleted-list',
  },
  {
    title: 'Numbered List',
    icon: '1.',
    command: 'numbered-list',
  },
  {
    title: 'Todo List',
    icon: '☑',
    command: 'todo-list',
  },
  {
    title: 'Quote',
    icon: '"',
    command: 'blockquote',
  },
  {
    title: 'Code',
    icon: '</>', 
    command: 'code',
  },
  {
    title: 'Divider',
    icon: '—',
    command: 'divider',
  },
  ...(createTaskFn ? [{
    title: 'Create Task',
    icon: '✓',
    command: 'create-task',
    action: createTaskFn,
  }] : []),
];

const MARKS = [Bold, Italic, CodeMark, Underline, Strike];

const YooptaEditorComponent = forwardRef<YooptaEditorRef, YooptaEditorComponentProps>(({ 
  value = "", 
  onChange, 
  placeholder = "Type '/' for commands...",
  className = "",
  readOnly = false 
}, ref) => {
  
  const editor = useMemo(() => createYooptaEditor(), []);
  const selectionRef = useRef(null);
  const queryClient = useQueryClient();
  
  // Parse initial value
  const [editorValue, setEditorValue] = useState<YooptaContentValue>(() => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/tasks", taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Handle creating tasks from selected text
  const handleCreateTask = (selectedText: string) => {
    if (selectedText.trim()) {
      createTaskMutation.mutate({
        title: selectedText.trim(),
        description: `Created from note: ${selectedText.substring(0, 100)}...`
      });
    }
  };

  // Update editor value when prop changes
  useEffect(() => {
    try {
      const newValue = value ? JSON.parse(value) : {};
      setEditorValue(newValue);
    } catch {
      setEditorValue({});
    }
  }, [value]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getValue: () => JSON.stringify(editorValue),
    setValue: (newValue: string) => {
      try {
        const parsed = JSON.parse(newValue);
        setEditorValue(parsed);
      } catch {
        setEditorValue({});
      }
    }
  }));

  // Custom action menu render with viewport detection
  const CustomActionMenuRender = (props: any) => {
    return <DefaultActionMenuRender {...props} />;
  };

  // Create tools configuration with custom toolbar and action menu
  const TOOLS = useMemo(() => ({
    ActionMenu: {
      render: CustomActionMenuRender,
      tool: ActionMenuList,
    },
    Toolbar: {
      render: CustomToolbarRender,
      tool: Toolbar,
    },
  }), []);

  const handleEditorChange = (newValue: YooptaContentValue) => {
    setEditorValue(newValue);
    // Do not call onChange automatically - only on manual trigger
    if (onChange) {
      onChange(JSON.stringify(newValue));
    }
  };

  // Text sizing functionality using DOM manipulation like slash menu
  const applyTextSize = (size: 'small' | 'medium' | 'large') => {
    const sizeClasses = {
      small: 'text-sm',
      medium: 'text-base', 
      large: 'text-lg'
    };

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) return;

      // Remove existing size classes from selected content
      const selectedContent = range.cloneContents();
      const walker = document.createTreeWalker(
        selectedContent,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        if (node instanceof Element) {
          node.classList.remove('text-sm', 'text-base', 'text-lg');
        }
      }

      // Create wrapper with new size class
      const wrapper = document.createElement('span');
      wrapper.className = sizeClasses[size];
      
      // Extract and wrap content
      const contents = range.extractContents();
      wrapper.appendChild(contents);
      range.insertNode(wrapper);

      // Clear selection and trigger change
      selection.removeAllRanges();
      
      // Trigger editor update
      const event = new Event('input', { bubbles: true });
      const editorElement = wrapper.closest('[contenteditable="true"]');
      if (editorElement) {
        editorElement.dispatchEvent(event);
      }
    } catch (error) {
      console.warn('Text sizing failed:', error);
    }
  };

  // Custom toolbar render with text sizing and task creation buttons
  const CustomToolbarRender = ({ editor, ...props }: any) => {
    const handleCreateTaskFromSelection = () => {
      const selectedText = window.getSelection()?.toString();
      if (selectedText?.trim()) {
        handleCreateTask(selectedText.trim());
      }
    };

    return (
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card/50 backdrop-blur-sm">
        {/* Text Size Controls */}
        <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
          <span className="text-xs text-muted-foreground mr-2 font-medium">Size:</span>
          <button
            type="button"
            onClick={() => applyTextSize('small')}
            className="px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground rounded transition-colors border border-transparent hover:border-border"
            title="Small text"
          >
            S
          </button>
          <button
            type="button"
            onClick={() => applyTextSize('medium')}
            className="px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded transition-colors border border-transparent hover:border-border"
            title="Medium text"
          >
            M
          </button>
          <button
            type="button"
            onClick={() => applyTextSize('large')}
            className="px-3 py-1 text-base font-medium hover:bg-accent hover:text-accent-foreground rounded transition-colors border border-transparent hover:border-border"
            title="Large text"
          >
            L
          </button>
        </div>
        
        {/* Task Creation */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleCreateTaskFromSelection}
            className="px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 flex items-center gap-2"
            title="Select text and create a task"
            disabled={createTaskMutation.isPending}
          >
            <span className="text-base">✓</span>
            <span>Create Task</span>
          </button>
        </div>
        
        {/* Original Toolbar */}
        <div className="flex-1">
          <DefaultToolbarRender editor={editor} {...props} />
        </div>
      </div>
    );
  };

  if (readOnly) {
    return (
      <div className={`min-h-[200px] p-3 border rounded-md bg-muted ${className}`}>
        <YooptaEditor
          editor={editor}
          plugins={plugins}
          tools={TOOLS}
          marks={MARKS}
          value={editorValue}
          onChange={handleEditorChange}
          selectionBoxRoot={selectionRef}
          readOnly={true}
        />
        <div ref={selectionRef} />
      </div>
    );
  }

  return (
    <div className={`notes-editor-container ${className}`}>
      <div className="notes-editor-scrollable">
        <YooptaEditor
          editor={editor}
          plugins={plugins}
          tools={TOOLS}
          marks={MARKS}
          value={editorValue}
          onChange={handleEditorChange}
          selectionBoxRoot={selectionRef}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
      <div ref={selectionRef} />
    </div>
  );
});

YooptaEditorComponent.displayName = "YooptaEditorComponent";

export default YooptaEditorComponent;

// Utility function to convert rich text to plain text
export function yooptaToPlainText(value: string): string {
  return value || "";
}

// Utility function to convert plain text to rich text format (no-op for now)
export function plainTextToYoopta(text: string): string {
  return text || "";
}