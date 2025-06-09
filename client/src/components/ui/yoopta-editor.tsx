import { useEffect, useMemo, useState, useRef } from 'react';
import { createYooptaEditor } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import Link from '@yoopta/link';
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';

interface YooptaEditorComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const plugins = [
  Paragraph,
  HeadingOne,
  HeadingTwo, 
  HeadingThree,
  BulletedList,
  NumberedList,
  TodoList,
  Blockquote,
  Code,
  Link,
];

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
};

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

export default function YooptaEditorComponent({ 
  value = "", 
  onChange, 
  placeholder = "Type '/' for commands",
  className = "",
  readOnly = false 
}: YooptaEditorComponentProps) {
  const editor = useMemo(() => createYooptaEditor(), []);
  
  const [editorValue, setEditorValue] = useState(() => {
    if (!value) {
      return {
        [crypto.randomUUID()]: {
          id: crypto.randomUUID(),
          type: 'Paragraph',
          value: [
            {
              id: crypto.randomUUID(),
              type: 'paragraph',
              children: [{ text: '' }],
              props: { nodeType: 'block' },
            },
          ],
          meta: { order: 0, depth: 0 },
        },
      };
    }
    
    try {
      return JSON.parse(value);
    } catch {
      return {
        [crypto.randomUUID()]: {
          id: crypto.randomUUID(),
          type: 'Paragraph',
          value: [
            {
              id: crypto.randomUUID(),
              type: 'paragraph',
              children: [{ text: value }],
              props: { nodeType: 'block' },
            },
          ],
          meta: { order: 0, depth: 0 },
        },
      };
    }
  });

  useEffect(() => {
    if (value !== undefined) {
      try {
        const parsedValue = JSON.parse(value);
        setEditorValue(parsedValue);
      } catch {
        setEditorValue({
          [crypto.randomUUID()]: {
            id: crypto.randomUUID(),
            type: 'Paragraph',
            value: [
              {
                id: crypto.randomUUID(),
                type: 'paragraph',
                children: [{ text: value }],
                props: { nodeType: 'block' },
              },
            ],
            meta: { order: 0, depth: 0 },
          },
        });
      }
    }
  }, [value]);

  const handleChange = (newValue: any) => {
    setEditorValue(newValue);
    if (onChange) {
      onChange(JSON.stringify(newValue));
    }
  };

  return (
    <div className={`yoopta-editor-container ${className}`}>
      <style>{`
        .yoopta-editor {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 16px;
          min-height: 200px;
          background: hsl(var(--background));
        }
        
        .yoopta-editor:focus-within {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        .yoopta-action-menu-list {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          padding: 8px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 50;
        }
        
        .yoopta-toolbar {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          padding: 8px;
          z-index: 50;
        }
        
        .yoopta-editor [data-yoopta-block] {
          margin: 8px 0;
        }
        
        .yoopta-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 16px 0;
        }
        
        .yoopta-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 12px 0;
        }
        
        .yoopta-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 8px 0;
        }
        
        .yoopta-editor ul,
        .yoopta-editor ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        
        .yoopta-editor li {
          margin: 4px 0;
        }
        
        .yoopta-editor blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        
        .yoopta-editor pre {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .yoopta-editor code {
          background: hsl(var(--muted));
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
        }
        
        .yoopta-editor a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .yoopta-editor strong {
          font-weight: 600;
        }
        
        .yoopta-editor em {
          font-style: italic;
        }
      `}</style>
      
      <div 
        ref={(ref) => {
          if (ref && typeof window !== 'undefined') {
            // Initialize Yoopta editor programmatically
            import('@yoopta/editor').then(({ YooptaEditor }) => {
              if (ref.children.length === 0) {
                const { createRoot } = require('react-dom/client');
                const root = createRoot(ref);
                root.render(
                  YooptaEditor({
                    editor,
                    plugins,
                    tools: TOOLS,
                    marks: MARKS,
                    value: editorValue,
                    onChange: handleChange,
                    placeholder,
                    autoFocus: !readOnly,
                    readOnly,
                    className: "yoopta-editor"
                  })
                );
              }
            }).catch(() => {
              // Fallback to simple contentEditable
              ref.innerHTML = `
                <div 
                  contenteditable="${!readOnly}" 
                  class="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style="white-space: pre-wrap;"
                  placeholder="${placeholder}"
                >${value}</div>
              `;
              const editableDiv = ref.querySelector('[contenteditable]');
              if (editableDiv) {
                editableDiv.addEventListener('input', (e) => {
                  if (onChange) {
                    onChange((e.target as HTMLElement).textContent || '');
                  }
                });
              }
            });
          }
        }}
        className="yoopta-editor-wrapper"
      />
    </div>
  );
}

// Utility function to convert rich text to plain text
export function yooptaToPlainText(value: string): string {
  return value || "";
}

// Utility function to convert plain text to rich text format (no-op for now)
export function plainTextToYoopta(text: string): string {
  return text || "";
}