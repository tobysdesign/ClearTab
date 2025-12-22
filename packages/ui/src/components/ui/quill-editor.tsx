"use client";

import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.bubble.css";
import { cn } from "@/lib/utils";

interface QuillEditorProps {
  value?: any;
  onChange?: (content: any) => void;
  className?: string;
  placeholder?: string;
  editable?: boolean;
  onOpenAiChat?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  tabIndex?: number;
}

export function QuillEditor({
  value,
  onChange,
  className,
  placeholder = "Start writing...",
  editable = true,
  onOpenAiChat,
  onCreateTask,
  onBlur,
  readOnly = false,
  tabIndex,
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");

  // Store callbacks in refs to avoid reinitializing Quill on every callback change
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onOpenAiChatRef = useRef(onOpenAiChat);
  const onCreateTaskRef = useRef(onCreateTask);
  const selectedTextRef = useRef(selectedText);

  // Keep refs up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    onOpenAiChatRef.current = onOpenAiChat;
  }, [onOpenAiChat]);

  useEffect(() => {
    onCreateTaskRef.current = onCreateTask;
  }, [onCreateTask]);

  useEffect(() => {
    selectedTextRef.current = selectedText;
  }, [selectedText]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // Initialize Quill with bubble theme
    const quill = new Quill(editorRef.current, {
      theme: "bubble",
      placeholder: placeholder,
      readOnly: readOnly || !editable,
      modules: {
        toolbar: {
          container: [
            ["askAi"], // Custom Ask AI button at start
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            [{ header: 1 }, { header: 2 }],
            ["clean"],
            ["createTask"], // Custom Create Task button at end
          ],
          handlers: {
            askAi: function () {
              if (onOpenAiChatRef.current && selectedTextRef.current) {
                onOpenAiChatRef.current(selectedTextRef.current);
              }
            },
            createTask: function () {
              if (onCreateTaskRef.current && selectedTextRef.current) {
                onCreateTaskRef.current(selectedTextRef.current);
              }
            },
          },
        },
      },
    });

    quillRef.current = quill;

    // Add custom button labels to toolbar after initialization
    const toolbar = editorRef.current.querySelector(".ql-toolbar");
    if (toolbar) {
      // Style Ask AI button
      const askAiBtn = toolbar.querySelector(".ql-askAi");
      if (askAiBtn) {
        askAiBtn.innerHTML = "Ask AI";
        (askAiBtn as HTMLElement).style.cssText = "width: auto; padding: 0 8px; font-size: 12px; color: #a78bfa;";
      }
      // Style Create Task button
      const createTaskBtn = toolbar.querySelector(".ql-createTask");
      if (createTaskBtn) {
        createTaskBtn.innerHTML = "+ Task";
        (createTaskBtn as HTMLElement).style.cssText = "width: auto; padding: 0 8px; font-size: 12px; color: #7dd3fc;";
      }
    }

    if (tabIndex !== undefined) {
      const editableArea = editorRef.current.querySelector(".ql-editor");
      if (editableArea) {
        (editableArea as HTMLElement).tabIndex = tabIndex;
      }
    }

    // Set initial content - only if value exists and has content
    if (value) {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (parsed.ops && parsed.ops.length > 0) {
            quill.setContents(parsed);
          }
        } catch {
          // If it's not JSON, treat as plain text
          quill.setText(value);
        }
      } else if (value.ops && value.ops.length > 0) {
        quill.setContents(value);
      }
    }

    // Handle changes - use ref to avoid reinitializing on callback change
    quill.on("text-change", () => {
      const content = quill.getContents();
      if (onChangeRef.current) {
        onChangeRef.current(content);
      }
    });

    // Handle selection changes for AI features AND focus/blur
    quill.on("selection-change", (range) => {
      if (range) {
        if (range.length > 0) {
          const text = quill.getText(range.index, range.length).trim();
          setSelectedText(text);
        } else {
          setSelectedText("");
        }
      } else {
        // Range is null, meaning blur
        if (onBlurRef.current) {
          onBlurRef.current();
        }
      }
    });

    // Handle blur event is not standard in Quill, removed invalid listener

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [placeholder, readOnly, editable]); // ✅ Removed onChange and onBlur from dependencies

  // Update content when value changes externally
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      let contentToSet;

      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (parsed.ops) {
            contentToSet = parsed;
          }
        } catch {
          // If it's not JSON, treat as plain text
          quillRef.current.setText(value);
          return;
        }
      } else if (value && value.ops && value.ops.length > 0) {
        contentToSet = value;
      } else if (!value || (value.ops && value.ops.length === 0)) {
        // Handle empty/null value by setting empty content
        contentToSet = { ops: [{ insert: "\n" }] };
      }

      if (contentToSet) {
        const currentContent = quillRef.current.getContents();
        // More robust content comparison to prevent unnecessary updates
        const currentOps = currentContent.ops || [];
        const newOps = contentToSet.ops || [];

        // Simple comparison that avoids cursor jumping
        const isDifferent = currentOps.length !== newOps.length ||
          JSON.stringify(currentOps) !== JSON.stringify(newOps);

        if (isDifferent && !quillRef.current.hasFocus()) {
          quillRef.current.setContents(contentToSet);
        }
      }
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <div ref={editorRef} className="w-full" />
    </div>
  );
}
