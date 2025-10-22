'use client'

import React, { useState, useRef } from 'react'
import { AddButton } from '@/components/ui/add-button'
import { WidgetContainer } from '@/components/ui/widget-container'
import type { Note } from '@/shared/schema'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ClientOnly } from '@/components/ui/safe-motion'
import notesStyles from './notes-widget.module.css'
import { NoteListItem } from './note-list-item'

// Mock notes data
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to ClearTab',
    content: {
      ops: [
        { insert: 'Welcome to your new productivity dashboard! This is where you can capture thoughts, ideas, and important information.\n\n' },
        { insert: 'Try creating your first note after signing in.\n' }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'demo'
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: {
      ops: [
        { insert: 'Project kickoff meeting\n\n' },
        { insert: '• Review project timeline\n' },
        { insert: '• Assign team responsibilities\n' },
        { insert: '• Set up weekly check-ins\n' }
      ]
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    userId: 'demo'
  },
  {
    id: '3',
    title: 'Ideas & Inspiration',
    content: {
      ops: [
        { insert: 'Random thoughts and creative ideas:\n\n' },
        { insert: '• Dashboard customization features\n' },
        { insert: '• Integration with other tools\n' },
        { insert: '• Mobile app development\n' }
      ]
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    userId: 'demo'
  }
]

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
        const proportionalWidth = Math.max(minWidth, Math.min(containerWidth / 3, maxAllowedWidth));
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
          const proportionalWidth = Math.max(minWidth, Math.min(newContainerWidth / 3, maxAllowedWidth));
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
    let newWidth = e.clientX - containerRef.current.getBoundingClientRect().left;

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
        className={`${notesStyles.resizableLeft} ${currentWidth < 100 ? 'collapsed' : ''}`}
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
    setIsCollapsed(prev => !prev);
  };

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
          <div className="widget-header widget-flex-between">
            <h2 className="widget-title">Notes</h2>
            <AddButton onClick={() => {}} />
          </div>
          <div className={cn(notesStyles.notesListScroll, "custom-scrollbar")}>
            <div className={notesStyles.notesListContent}>
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
                        note={note as any}
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
                    value={mockNotes[0].title}
                    readOnly
                    className={notesStyles.notesTitleInput}
                    style={{ cursor: 'default' }}
                    rows={1}
                  />
                </div>
              </div>
            </div>
            <div className={notesStyles.notesEditorScroll}>
              <div className={notesStyles.notesEditorContainer} style={{
                padding: '0',
                lineHeight: '1.6',
                color: 'var(--foreground)',
                cursor: 'default'
              }}>
                {mockNotes[0].content.ops.map((op, i) => (
                  <div key={i} style={{ whiteSpace: 'pre-wrap' }}>
                    {op.insert}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ResizablePanels>
    </WidgetContainer>
  )
}
