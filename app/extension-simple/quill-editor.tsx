'use client';

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';

interface QuillEditorProps {
  value: any;
  onChange: (content: any) => void;
}

export default function QuillEditor({ value, onChange }: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // Initialize Quill with bubble theme
    const quill = new Quill(editorRef.current, {
      theme: 'bubble',
      placeholder: 'Start writing...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'header': 1 }, { 'header': 2 }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });

    quillRef.current = quill;

    // Set initial content
    if (value && value.ops) {
      quill.setContents(value);
    }

    // Handle changes
    quill.on('text-change', () => {
      const content = quill.getContents();
      onChange(content);
    });

    return () => {
      // Cleanup
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when value changes externally
  useEffect(() => {
    if (quillRef.current && value && value.ops) {
      const currentContent = quillRef.current.getContents();
      if (JSON.stringify(currentContent) !== JSON.stringify(value)) {
        quillRef.current.setContents(value);
      }
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      style={{
        height: '100%',
        minHeight: '300px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        fontSize: '14px'
      }}
    />
  );
}