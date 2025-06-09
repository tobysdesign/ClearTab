import { useMemo, useRef, useEffect, useState } from 'react';
import YooptaEditor, { createYooptaEditor, YooptaContentValue } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import { Bold, Italic, CodeMark, Underline, Strike } from '@yoopta/marks';
import Link from '@yoopta/link';
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
  Blockquote,
  BulletedList,
  NumberedList,
  TodoList,
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

const MARKS = [Bold, Italic, CodeMark, Underline, Strike];

export default function YooptaEditorComponent({ 
  value = "", 
  onChange, 
  placeholder = "Type '/' for commands...",
  className = "",
  readOnly = false 
}: YooptaEditorComponentProps) {
  
  const editor = useMemo(() => createYooptaEditor(), []);
  const selectionRef = useRef(null);
  
  // Parse initial value
  const [editorValue, setEditorValue] = useState<YooptaContentValue>(() => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  });

  // Update editor value when prop changes
  useEffect(() => {
    try {
      const newValue = value ? JSON.parse(value) : {};
      setEditorValue(newValue);
    } catch {
      setEditorValue({});
    }
  }, [value]);

  const handleEditorChange = (newValue: YooptaContentValue) => {
    setEditorValue(newValue);
    // Only call onChange when provided - no auto-save
    if (onChange) {
      onChange(JSON.stringify(newValue));
    }
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
    <div className={`min-h-[200px] border rounded-md ${className}`}>
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
      <div ref={selectionRef} />
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