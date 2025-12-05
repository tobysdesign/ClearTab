"use client";

import React, { useState, useRef, useEffect } from "react";
import { AddButton } from "@/components/ui/add-button";
import { WidgetContainer, WidgetHeader } from "@cleartab/ui";

import type { Note } from "@/shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ClientOnly } from "@/components/ui/safe-motion";
import notesStyles from "./notes-widget.module.css";
import { NoteListItem } from "./note-list-item";

// Mock notes data
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Welcome to ClearTab",
    content: {
      ops: [
        {
          insert:
            "Welcome to your new productivity dashboard! This is where you can capture thoughts, ideas, and important information.\n\n",
        },
        { insert: "Try creating your first note after signing in.\n" },
      ],
    } as Note["content"],
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "demo",
  },
  {
    id: "2",
    title: "Meeting Notes",
    content: {
      ops: [
        { insert: "Project kickoff meeting\n\n" },
        { insert: "• Review project timeline\n" },
        { insert: "• Assign team responsibilities\n" },
        { insert: "• Set up weekly check-ins\n" },
      ],
    } as Note["content"],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
    userId: "demo",
  },
  {
    id: "3",
    title: "Ideas & Inspiration",
    content: {
      ops: [
        { insert: "Random thoughts and creative ideas:\n\n" },
        { insert: "• Dashboard customization features\n" },
        { insert: "• Integration with other tools\n" },
        { insert: "• Mobile app development\n" },
      ],
    } as Note["content"],
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
    userId: "demo",
  },
];

// Typewriter component for animating note title and content in sequence
function TypewriterText({ title, content, className }: { title: string; content: string; className?: string }) {
  const [phase, setPhase] = useState<'typing_title' | 'typing_content' | 'pause' | 'erasing_content' | 'erasing_title'>('typing_title');
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const typeSpeed = 30 + Math.random() * 50; // Variable typing speed
    const eraseSpeed = 20; // Faster erasing

    if (phase === 'typing_title') {
      if (currentTitle.length < title.length) {
        const timer = setTimeout(() => {
          setCurrentTitle(title.slice(0, currentTitle.length + 1));
        }, typeSpeed);
        return () => clearTimeout(timer);
      } else {
        setPhase('typing_content');
      }
    } else if (phase === 'typing_content') {
      if (currentContent.length < content.length) {
        const timer = setTimeout(() => {
          setCurrentContent(content.slice(0, currentContent.length + 1));
        }, typeSpeed);
        return () => clearTimeout(timer);
      } else {
        setPhase('pause');
        const timer = setTimeout(() => {
          setPhase('erasing_content');
        }, 5000); // Pause for 5 seconds
        return () => clearTimeout(timer);
      }
    } else if (phase === 'erasing_content') {
      if (currentContent.length > 0) {
        const timer = setTimeout(() => {
          setCurrentContent(currentContent.slice(0, -1));
        }, eraseSpeed);
        return () => clearTimeout(timer);
      } else {
        setPhase('erasing_title');
      }
    } else if (phase === 'erasing_title') {
      if (currentTitle.length > 0) {
        const timer = setTimeout(() => {
          setCurrentTitle(currentTitle.slice(0, -1));
        }, eraseSpeed);
        return () => clearTimeout(timer);
      } else {
        setPhase('typing_title');
      }
    }
  }, [currentTitle, currentContent, phase, title, content]);

  // Update isTyping based on phase
  useEffect(() => {
    setIsTyping(phase === 'typing_title' || phase === 'typing_content');
  }, [phase]);

  return {
    currentTitle,
    currentContent,
    isTyping,
    renderContent: () => (
      <div className={className} style={{ whiteSpace: "pre-wrap" }}>
        {currentContent}
        <span style={{
          opacity: isTyping ? 1 : 0.3,
          animation: 'blink 1s infinite'
        }}>|</span>
        <style jsx>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}</style>
      </div>
    )
  };
}

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode];
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsed?: boolean;
  onToggleCollapse: () => void;
  onWidthChange?: (width: number) => void;
}

function ResizablePanels({
  children,
  defaultWidth = 300,
  minWidth = 50,
  maxWidth = 500,
  collapsed = false,
  onToggleCollapse,
  onWidthChange,
}: ResizablePanelsProps) {
  const [currentWidth, setCurrentWidth] = useState(defaultWidth);
  const [containerWidth, setContainerWidth] = useState(0);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const collapseTriggered = useRef(false);

  React.useEffect(() => {
    if (!collapsed) {
      // Set proportional width: 1/3 of container width, but respect right panel minimum
      if (containerWidth > 0) {
        const maxAllowedWidth = Math.min(maxWidth, containerWidth * 0.4);
        const proportionalWidth = Math.max(
          minWidth,
          Math.min(containerWidth / 3, maxAllowedWidth),
        );
        setCurrentWidth(proportionalWidth);
      } else {
        setCurrentWidth(defaultWidth);
      }
    }
  }, [collapsed, defaultWidth, containerWidth, minWidth, maxWidth]);

  // Track container width changes for proportional resizing
  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newContainerWidth = entry.contentRect.width;
        setContainerWidth(newContainerWidth);

        // Update currentWidth proportionally if not currently resizing
        if (!isResizing.current && newContainerWidth > 0) {
          // Ensure right panel gets at least 60% by limiting left panel to max 40%
          const maxAllowedWidth = Math.min(maxWidth, newContainerWidth * 0.4);
          const proportionalWidth = Math.max(
            minWidth,
            Math.min(newContainerWidth / 3, maxAllowedWidth),
          );
          setCurrentWidth(proportionalWidth);
          onWidthChange?.(proportionalWidth);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [minWidth, maxWidth, onWidthChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    collapseTriggered.current = false;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;
    let newWidth =
      e.clientX - containerRef.current.getBoundingClientRect().left;

    // Constrain to min/max width and container size (right panel gets at least 60%)
    const maxAllowedWidth = Math.min(maxWidth, containerWidth * 0.4); // Max 40% of container (so right gets 60%)
    newWidth = Math.max(minWidth, Math.min(newWidth, maxAllowedWidth));
    setCurrentWidth(newWidth);
    onWidthChange?.(newWidth);
  };

  return (
    <div className={notesStyles.resizablePanels} ref={containerRef}>
      <div
        style={{ width: currentWidth }}
        className={`${notesStyles.resizableLeft} ${currentWidth < 100 ? "collapsed" : ""}`}
      >
        {children[0]}
      </div>
      <div
        className={notesStyles.resizableHandle}
        onMouseDown={handleMouseDown}
      />
      <div className={notesStyles.resizableRight}>{children[1]}</div>
    </div>
  );
}

// Static component that mimics the notes widget appearance without API calls
export function LoginNotesWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(300);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const note = mockNotes[0];
  const title = note.title;
  const content = note.content.ops
    .filter((op: any) => "insert" in op && typeof op.insert === "string")
    .map((op: any) => op.insert)
    .join("");

  const { currentTitle, renderContent } = TypewriterText({ title, content, className: notesStyles.typewriterContent });

  return (
    <WidgetContainer>
      <ResizablePanels
        defaultWidth={300}
        collapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onWidthChange={setPanelWidth}
      >
        {/* Notes List */}
        <div className={notesStyles.notesListPanel}>
          <WidgetHeader title="Notes">
            <AddButton onClick={() => {}} tooltip="Add note" />
          </WidgetHeader>
          <div className={cn(notesStyles.notesListScroll, "custom-scrollbar")}>
            <div className="ListContent">
              <ClientOnly>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                >
                  <AnimatePresence>
                    {mockNotes.map((note, index) => (
                      <NoteListItem
                        key={note.id}
                        note={note}
                        isSelected={index === 0}
                        onClick={() => {}}
                        onDelete={() => {}}
                        collapsed={panelWidth < 100}
                        isEditing={false}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Note Editor */}
        <div className={notesStyles.notesEditorPanel}>
          <div className={notesStyles.notesContentPanel}>
            <div className={notesStyles.notesEditorHeader}>
              <div className={notesStyles.notesHeaderContent}>
                 <div className={notesStyles.notesTitleContainer}>
                   <textarea
                     value={currentTitle}
                     readOnly
                     className={notesStyles.notesTitleInput}
                     rows={1}
                   />
                 </div>
              </div>
            </div>
             <div className={notesStyles.notesEditorScroll}>
               <div className={notesStyles.notesEditorContainer}>
                 {renderContent()}
               </div>
             </div>
          </div>
        </div>
      </ResizablePanels>
    </WidgetContainer>
  );
}
