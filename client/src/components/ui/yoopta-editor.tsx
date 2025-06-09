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

const YooptaEditorComponent = forwardRef<YooptaEditorRef, YooptaEditorComponentProps>(({ 
  value = "", 
  onChange, 
  placeholder = "Type '/' for commands...",
  className = "",
  readOnly = false 
}, ref) => {
  
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

  const handleEditorChange = (newValue: YooptaContentValue) => {
    setEditorValue(newValue);
    // Do not call onChange automatically - only on manual trigger
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
    <div className={`min-h-[200px] ${className}`}>
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