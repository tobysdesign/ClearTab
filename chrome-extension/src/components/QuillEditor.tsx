import React, { useEffect, useRef, useCallback, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';

interface QuillEditorProps {
  value?: any;
  onChange?: (content: any) => void;
  className?: string;
  placeholder?: string;
  editable?: boolean;
  onBlur?: () => void;
  readOnly?: boolean;
  tabIndex?: number;
}

export function QuillEditor({
  value,
  onChange,
  className,
  placeholder = 'Start writing...',
  editable = true,
  onBlur,
  readOnly = false,
  tabIndex,
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: 'bubble',
      placeholder: placeholder,
      readOnly: readOnly || !editable,
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ],
      },
    });

    quillRef.current = quill;

    if (tabIndex !== undefined) {
      const editableArea = editorRef.current.querySelector('.ql-editor');
      if (editableArea) {
        (editableArea as HTMLElement).tabIndex = tabIndex;
      }
    }

    if (value) {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed.ops) {
            quill.setContents(parsed);
          }
        } catch {
          quill.setText(value);
        }
      } else if (value.ops) {
        quill.setContents(value);
      }
    }

    quill.on('text-change', () => {
      const content = quill.getContents();
      if (onChange) {
        onChange(content);
      }
    });

    quill.on('blur', () => {
      if (onBlur) {
        onBlur();
      }
    });

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [placeholder, readOnly, editable, onChange, onBlur]);

  useEffect(() => {
    if (quillRef.current) {
      let contentToSet;

      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed.ops) {
            contentToSet = parsed;
          }
        } catch {
          quillRef.current.setText(value);
          return;
        }
      } else if (value && value.ops) {
        contentToSet = value;
      } else if (!value) {
        contentToSet = { ops: [{ insert: '\n' }] };
      }

      if (contentToSet) {
        const currentContent = quillRef.current.getContents();
        if (JSON.stringify(currentContent) !== JSON.stringify(contentToSet)) {
          quillRef.current.setContents(contentToSet);
        }
      }
    }
  }, [value]);

  return (
    <div className={['relative', className].join(' ')}>
      <div ref={editorRef} className="min-h-[300px] w-full" />
    </div>
  );
}
