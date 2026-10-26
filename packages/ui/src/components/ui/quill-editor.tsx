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
  // The bubble toolbar is moved into a wrapper on document.body (see init), so
  // React won't remove it with the editor — track it and clean it up ourselves.
  const tooltipRootRef = useRef<HTMLElement | null>(null);
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

    // Float the bubble toolbar above the whole page.
    // Quill positions the bubble assuming it can stretch across document.body
    // (its default bounds), but the tooltip actually lives inside .ql-container,
    // which sits inside the note panel's overflow:auto scroll area and the
    // overflow:hidden dashboard wrappers. In a narrow note panel the full-width
    // pill is wider than the panel, so those ancestors clip it (the "Ask AI" / "B"
    // side gets chopped and "+ Task" wraps). Re-parenting the tooltip to <body>
    // and positioning it fixed removes every clipping ancestor and lets us clamp
    // it to the viewport instead.
    const tooltip: any = (quill as any)?.theme?.tooltip;
    if (tooltip?.root) {
      const root: HTMLElement = tooltip.root;
      // Every bubble style (Quill's own quill.bubble.css and our quill-custom.css)
      // is scoped under `.ql-bubble`, which normally lives on .ql-container. Moving
      // the tooltip straight onto <body> would drop it out of that scope and strip
      // all its styling (the pill, icon sizing, colours). Re-create the scope with a
      // zero-size `.ql-bubble` wrapper on <body> so every selector still matches.
      const wrapper = document.createElement("div");
      wrapper.className = "ql-bubble";
      wrapper.appendChild(root);
      document.body.appendChild(wrapper);
      tooltipRootRef.current = wrapper;
      root.style.position = "fixed";
      const arrow = root.querySelector(".ql-tooltip-arrow") as HTMLElement | null;
      const MARGIN = 10; // keep this far from the viewport edges

      tooltip.position = function (reference: {
        left: number;
        top: number;
        bottom: number;
        width: number;
      }) {
        // `reference` is relative to .ql-container; convert to viewport coords.
        const containerRect = quill.container.getBoundingClientRect();
        const rootW = root.offsetWidth;
        const rootH = root.offsetHeight;
        const anchorX = containerRect.left + reference.left + reference.width / 2;
        const selTop = containerRect.top + reference.top;
        const selBottom = containerRect.top + reference.bottom;

        // Horizontal: centre on the selection, then clamp inside the viewport.
        const centredLeft = anchorX - rootW / 2;
        const maxLeft = window.innerWidth - rootW - MARGIN;
        const left = Math.max(MARGIN, Math.min(centredLeft, maxLeft));
        const shift = left - centredLeft; // >0 pushed right, <0 pushed left
        root.style.left = `${left}px`;

        // Vertical: prefer ABOVE the selection so the pill doesn't cover the
        // text just below it; drop below only when there isn't room up top.
        // `ql-flip` makes the arrow point down (pill above); the GAP is baked
        // into `top` because the CSS neutralises Quill's translateY gap so the
        // transform is free for the show/hide spring.
        const GAP = 10;
        let top = selTop - rootH - GAP;
        const above = top >= MARGIN;
        if (!above) {
          top = selBottom + GAP;
        }
        root.classList.toggle("ql-flip", above);
        root.style.top = `${top}px`;
        root.style.marginTop = ""; // neutralise Quill's scroll-offset hack

        // Keep the arrow pointing at the selection after a horizontal clamp.
        if (arrow) {
          arrow.style.marginLeft =
            shift !== 0 ? `${-shift - arrow.offsetWidth / 2}px` : "";
        }
        return shift;
      };
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
    // Only report edits the user made. Loading a note calls setContents (source "api"),
    // which used to count as an edit: opening a note re-saved it and bumped its modified date.
    quill.on("text-change", (_delta, _oldDelta, source) => {
      if (source !== "user") return;
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
      // The bubble toolbar lives in a wrapper on <body>, so it survives the editor
      // being unmounted — remove the wrapper explicitly to avoid orphaned pills.
      if (tooltipRootRef.current) {
        tooltipRootRef.current.remove();
        tooltipRootRef.current = null;
      }
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
