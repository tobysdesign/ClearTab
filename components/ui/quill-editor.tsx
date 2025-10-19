"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.bubble.css";
import { cn } from "@/lib/utils";
import { Button } from "./button";
// Removed circular import - createTaskFromText functionality moved to context

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
  const [hasSelection, setHasSelection] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // Initialize Quill with bubble theme
    const quill = new Quill(editorRef.current, {
      theme: "bubble",
      placeholder: placeholder,
      readOnly: readOnly || !editable,
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ header: 1 }, { header: 2 }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean"],
        ],
      },
    });

    quillRef.current = quill;

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

    // Handle changes
    quill.on("text-change", () => {
      const content = quill.getContents();
      if (onChange) {
        onChange(content);
      }
    });

    // Handle selection changes for AI features
    quill.on("selection-change", (range) => {
      if (range && range.length > 0) {
        const text = quill.getText(range.index, range.length).trim();
        setSelectedText(text);
        setHasSelection(!!text);
      } else {
        setSelectedText("");
        setHasSelection(false);
      }
    });

    // Handle blur event
    quill.on("blur", () => {
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
        // Only update if content is actually different to prevent cursor jumping
        if (JSON.stringify(currentContent) !== JSON.stringify(contentToSet)) {
          quillRef.current.setContents(contentToSet);
        }
      }
    }
  }, [value]);

  // Handle AI chat button click
  const handleAiChatClick = useCallback(() => {
    if (selectedText && onOpenAiChat) {
      onOpenAiChat(selectedText);
    }
  }, [selectedText, onOpenAiChat]);

  // Handle task creation button click
  const handleCreateTaskClick = useCallback(async () => {
    if (!selectedText) return;

    try {
      setIsCreatingTask(true);

      if (onCreateTask) {
        // Use the callback if provided
        onCreateTask(selectedText);
      } else {
        console.log("No onCreateTask callback provided");
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreatingTask(false);
    }
  }, [selectedText, onCreateTask]);

  return (
    <div className={cn("relative", className)}>
      <div ref={editorRef} className="w-full" />

      {/* AI action buttons that appear when text is selected */}
      {hasSelection && !readOnly && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onOpenAiChat && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAiChatClick}
              className="shadow-md"
            >
              Ask AI
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCreateTaskClick}
            disabled={isCreatingTask}
            className="shadow-md"
          >
            {isCreatingTask ? "Creating..." : "Create Task"}
          </Button>
        </div>
      )}
    </div>
  );
}
