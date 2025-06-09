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
import { useEffect, useMemo, useState, useRef } from 'react';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
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
    setIsClient(true);
  }, []);

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

  if (!isClient) {
    return (
      <div className={`p-3 border rounded-md bg-background text-sm ${className}`}>
        <div className="text-muted-foreground">{placeholder}</div>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className={`yoopta-read-only ${className}`}>
        <div ref={editorRef} className="yoopta-editor-readonly" />
      </div>
    );
  }

  return (
    <div className={`yoopta-editor-container ${className}`}>
      <div ref={editorRef} className="yoopta-editor-wrapper" />
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