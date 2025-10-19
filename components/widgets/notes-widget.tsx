"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
// import { Input } from "@/components/ui/input";

import { AddButton } from "@/components/ui/add-button";
import { WidgetHeader } from "@/components/ui/widget-header";
import {
  WidgetContainer,
  // WidgetContent,
} from "@/components/ui/widget-container";
import dynamic from 'next/dynamic';

const DynamicQuillEditor = dynamic(
  () => import("@/components/ui/quill-editor").then(mod => mod.QuillEditor),
  {
    ssr: false,
    loading: () => null
  }
);
import { type Note } from "@/shared/schema";

// Empty Quill content
const EMPTY_QUILL_CONTENT = { ops: [{ insert: "\n" }] };
import { useNotes } from "@/hooks/use-notes";
import { AnimatePresence } from "framer-motion";
import { WidgetLoader } from "./widget-loader";
import { EmptyState } from "@/components/ui/empty-state";
// import styles from "./widget.module.css";
import notesStyles from "./notes-widget.module.css";
import { NoteListItem } from "./note-list-item";
import { cn } from "@/lib/utils";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
// import { useDebounce } from "@/hooks/use-debounce";
// import { api } from "@/lib/api-client";

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode];
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsed?: boolean;
  onToggleCollapse: () => void;
}

function ResizablePanels({
  children,
  defaultWidth = 300,
  minWidth = 120,
  maxWidth = 500,
  collapsed = false,
  onToggleCollapse,
}: ResizablePanelsProps) {
  const [currentWidth, setCurrentWidth] = useState(defaultWidth);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const collapseTriggered = useRef(false);

  useEffect(() => {
    if (!collapsed) {
      setCurrentWidth(defaultWidth);
    }
  }, [collapsed, defaultWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    collapseTriggered.current = false; // Reset on new drag
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
    const collapseThreshold = 90;

    if (!collapseTriggered.current) {
      if (!collapsed && newWidth < collapseThreshold) {
        onToggleCollapse();
        collapseTriggered.current = true;
      } else if (collapsed && newWidth > collapseThreshold) {
        onToggleCollapse();
        collapseTriggered.current = true;
      }
    }

    if (!collapsed) {
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setCurrentWidth(newWidth);
    }
  };

  return (
    <div className={notesStyles.resizablePanels} ref={containerRef}>
      <div
        style={{ width: collapsed ? 60 : currentWidth }}
        className={notesStyles.resizableLeft}
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

// Helper for deep equality check (for content)
function _isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function NotesWidget() {
  const {
    notes,
    createNote,
    updateNote,
    deleteNote,
    isLoadingNotes,
    loadNotes,
    updateNoteOptimistic,
  } = useNotes();
  const { toast } = useToast();
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(null);
  const [displayTitle, setDisplayTitle] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedContent = useRef<string>("");
  const lastSavedTitle = useRef<string>("");

  const activeNoteIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const draftCounterRef = useRef(0);

  // Generate unique draft ID to prevent duplicate keys
  const generateDraftId = useCallback(() => {
    draftCounterRef.current += 1;
    return `draft-${Date.now()}-${draftCounterRef.current}`;
  }, []);

  // Load notes on mount (only once)
  useEffect(() => {
    loadNotes();
  }, []); // Remove loadNotes dependency to prevent refresh loops

  // Single effect to handle initialization and note deletion
  useEffect(() => {
    if (isLoadingNotes) return;

    // Initialize only once when notes are loaded
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;

      // Always create a blank note as the first/active note
      const blankNote = {
        id: generateDraftId(),
        title: "",
        content: EMPTY_QUILL_CONTENT,
      };
      setActiveNote(blankNote);
      setDisplayTitle("");
      activeNoteIdRef.current = blankNote.id;
      lastSavedContent.current = JSON.stringify(EMPTY_QUILL_CONTENT);
      lastSavedTitle.current = "";
      return;
    }

    // Handle case where active note was deleted
    // Only check for deletion if the active note is a saved note (not a draft)
    if (
      activeNoteIdRef.current &&
      !activeNoteIdRef.current.startsWith("draft-") &&
      !notes.some((n) => n.id === activeNoteIdRef.current)
    ) {
      // If the active saved note was deleted, create a new blank note
      const newNote = {
        id: generateDraftId(),
        title: "",
        content: EMPTY_QUILL_CONTENT,
      };
      setActiveNote(newNote);
      setDisplayTitle("");
      activeNoteIdRef.current = newNote.id;
      lastSavedContent.current = JSON.stringify(EMPTY_QUILL_CONTENT);
      lastSavedTitle.current = "";
    }
  }, [notes, isLoadingNotes, generateDraftId]);

  // Effect to sync editor content - only trigger on note ID change, not content
  useEffect(() => {
    if (!activeNote?.content) return;

    const content = activeNote.content;
    const contentStr = JSON.stringify(content);

    // Only update if content actually changed to prevent unnecessary updates
    if (contentStr === lastSavedContent.current) return;

    lastSavedContent.current = contentStr;
    lastSavedTitle.current = activeNote.title || "";

    // Sync display title with the note title when content updates (but not while user is typing)
    if (activeNote.title !== undefined && activeNote.title !== displayTitle) {
      setDisplayTitleSafe(activeNote.title);
    }
  }, [activeNote?.id]); // Only depend on ID, not content to prevent refresh loops

  const activeNoteRef = useRef<Partial<Note> | null>(null);
  const isSavingRef = useRef(false); // Prevent multiple simultaneous saves
  const isUserTypingRef = useRef(false); // Prevent reloads while user is typing

  // Protected setDisplayTitle that respects typing state
  const setDisplayTitleSafe = useCallback((title: string) => {
    if (!isUserTypingRef.current) {
      setDisplayTitle(title);
    }
  }, []);

  // Keep activeNoteRef in sync with activeNote
  useEffect(() => {
    activeNoteRef.current = activeNote;
  }, [activeNote]);

  // Unified save function
  const saveCurrentNote = useCallback(async () => {
    if (!activeNoteRef.current || isSavingRef.current) return;

    const currentNote = activeNoteRef.current;

    // If it's a new note (draft) and both title and content are empty, don't save.
    const isContentEmpty = _isEqual(currentNote.content, EMPTY_QUILL_CONTENT);
    const isTitleEmpty = !currentNote.title || currentNote.title.trim() === "";
    if (
      currentNote.id?.startsWith("draft-") &&
      isTitleEmpty &&
      isContentEmpty
    ) {
      return; // Abort save for empty draft note
    }
    const isDraft = currentNote.id?.startsWith("draft-");

    try {
      isSavingRef.current = true;

      if (isDraft) {
        // Create new note for draft
        const savedNoteRaw = await createNote.mutate({
          title: currentNote.title?.trim() || "Untitled Note",
          content: currentNote.content,
          temporaryId: currentNote.id,
        });

        let parsedContent = savedNoteRaw.content;
        if (typeof savedNoteRaw.content === "string") {
          try {
            parsedContent = JSON.parse(savedNoteRaw.content);
          } catch (e) {
            console.error("Could not parse content", e);
          }
        }

        const savedNote = { ...savedNoteRaw, content: parsedContent };

        // Update the active note state with the saved note
        setActiveNote(savedNote);

        // Update refs to point to the new saved note
        activeNoteIdRef.current = savedNote.id;
        activeNoteRef.current = savedNote;
        lastSavedContent.current = JSON.stringify(savedNote.content);
        lastSavedTitle.current = savedNote.title || "";

        console.log("Note saved (was draft):", savedNote.id);
      } else {
        // Update existing note
        const savedNoteRaw = await updateNote.mutate({
          id: currentNote.id,
          title: currentNote.title,
          content: currentNote.content,
        });

        if (savedNoteRaw) {
          let parsedContent = savedNoteRaw.content;
          if (typeof savedNoteRaw.content === "string") {
            try {
              parsedContent = JSON.parse(savedNoteRaw.content);
            } catch (e) {
              console.error("Could not parse content", e);
            }
          }
          const savedNote = { ...savedNoteRaw, content: parsedContent };
          setActiveNote(savedNote);
        }

        lastSavedContent.current = JSON.stringify(currentNote.content);
        lastSavedTitle.current = currentNote.title || "";
        console.log("Note saved (existing):", currentNote.id);
      }

      // Note: Don't clear editing state here as it causes focus loss
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [createNote, updateNote, setActiveNote]);

  // Background save system - completely decoupled from user input
  const backgroundSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleBackgroundSave = useCallback(() => {
    // Clear any existing timeout
    if (backgroundSaveTimeoutRef.current) {
      clearTimeout(backgroundSaveTimeoutRef.current);
    }

    // Schedule save for 3 seconds from now
    backgroundSaveTimeoutRef.current = setTimeout(() => {
      // Only save if there are actual changes and user isn't actively typing
      if (activeNoteRef.current && !isUserTypingRef.current) {
        saveCurrentNote();
      }
    }, 3000);
  }, [saveCurrentNote]);

  // Save note function (must be defined before debouncedSave)
  const saveNote = useCallback(
    async (noteToSave: Partial<Note>, showToast = false) => {
      // Prevent saving if already saving or if note doesn't exist
      if (isSaving || !noteToSave?.id) return;

      const isDraft = noteToSave.id?.startsWith("draft-");
      const finalNote = {
        ...noteToSave,
        title: noteToSave.title?.trim() || "Untitled Note",
      };

      setIsSaving(true);

      try {
        if (isDraft) {
          const savedNote = await createNote.mutate({
            ...finalNote,
            temporaryId: finalNote.id, // Pass the draft ID as temporaryId
          } as Omit<Note, "id" | "createdAt" | "updatedAt" | "userId"> & {
            temporaryId: string;
          });

          // Update refs without triggering re-renders to prevent refresh
          activeNoteIdRef.current = savedNote.id;
          lastSavedContent.current = JSON.stringify(savedNote.content);
          lastSavedTitle.current = savedNote.title || "";

          // Update activeNoteRef without state setter to avoid re-render
          activeNoteRef.current = {
            id: savedNote.id,
            title: savedNote.title,
            content: savedNote.content,
          };

          if (showToast) {
            toast({
              title: "Note created",
              description: "Your note has been saved successfully.",
            });
          }
        } else {
          const savedNote = await updateNote.mutate(finalNote as Note);
          // Update tracking refs
          lastSavedContent.current = JSON.stringify(savedNote.content);
          lastSavedTitle.current = savedNote.title || "";
        }
      } catch (error) {
        console.error("Failed to save note:", error);
        toast({
          title: isDraft ? "Failed to create note" : "Failed to save note",
          description: (error as Error).message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [createNote, updateNote, toast, isSaving],
  );

  // Removed old debouncedSave - now using direct setTimeout approach in onChange handlers

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newTitle = e.target.value;

      // Mark user as actively typing FIRST to prevent any interference
      isUserTypingRef.current = true;

      if (!activeNoteRef.current) return;

      // Use requestAnimationFrame to ensure DOM is stable before updating state
      requestAnimationFrame(() => {
        // Update display title immediately (no editor re-render)
        setDisplayTitle(newTitle);

        // Update ref directly without triggering note re-render
        activeNoteRef.current = { ...activeNoteRef.current, title: newTitle };

        // Only update list for saved notes, not drafts (to prevent input focus issues)
        if (!activeNoteRef.current.id?.startsWith("draft-")) {
          updateNoteOptimistic(activeNoteRef.current.id, { title: newTitle });
        }
      });

      // Clear typing flag after user stops typing
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 2000);

      // Schedule background save (won't interrupt typing)
      scheduleBackgroundSave();
    },
    [scheduleBackgroundSave],
  );

  const handleTitleBlur = useCallback(() => {
    // Save immediately on blur - cancel any pending background save
    if (backgroundSaveTimeoutRef.current) {
      clearTimeout(backgroundSaveTimeoutRef.current);
    }
    saveCurrentNote();
  }, [saveCurrentNote]);

  const handleSelectNote = useCallback(
    async (note: Note) => {
      // First, save the current note if there is one and it has changes
      if (activeNoteRef.current && activeNoteRef.current.id !== note.id) {
        try {
          await saveCurrentNote();
        } catch (error) {
          console.error("Failed to save current note before switching:", error);
          // Continue with switch even if save failed
        }
      }

      // Parse content if it's a string (from API), otherwise use as-is
      let parsedContent = note.content;
      if (typeof note.content === "string") {
        try {
          parsedContent = JSON.parse(note.content);
        } catch (error) {
          console.error("Failed to parse note content:", error);
          parsedContent = EMPTY_QUILL_CONTENT;
        }
      }

      const noteWithParsedContent = { ...note, content: parsedContent };

      // Update all references first
      activeNoteIdRef.current = note.id;
      activeNoteRef.current = noteWithParsedContent;
      lastSavedContent.current = JSON.stringify(parsedContent);
      lastSavedTitle.current = note.title || "";

      // Then update state to trigger re-render
      setActiveNote(noteWithParsedContent);
      setDisplayTitleSafe(note.title || "");

      console.log("Selected note:", note.id, "with content:", parsedContent);
    },
    [setDisplayTitleSafe, saveCurrentNote],
  );

  // Save handler is now handled by individual blur events
  const handleSaveOnBlur = useCallback(() => {
    // No-op - saving is now handled by onBlur events
  }, []);

  // Add event listeners for when user clicks outside notes widget
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const notesWidget = document.querySelector('[data-widget="notes"]');
      if (notesWidget && !notesWidget.contains(event.target as Node)) {
        handleSaveOnBlur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleSaveOnBlur]);

  // Save before tab closes to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeNoteRef.current && isEditing) {
        // Cancel background save timeout and save immediately
        if (backgroundSaveTimeoutRef.current) {
          clearTimeout(backgroundSaveTimeoutRef.current);
        }
        saveCurrentNote();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditing, saveCurrentNote]);

  const handleCreateNew = useCallback(() => {
    // Create new draft note without state setters that cause refreshes
    const newNote = {
      id: generateDraftId(),
      title: "",
      content: EMPTY_QUILL_CONTENT,
    };

    // Update refs directly to avoid re-renders
    activeNoteIdRef.current = newNote.id;
    activeNoteRef.current = newNote;
    lastSavedContent.current = JSON.stringify(EMPTY_QUILL_CONTENT);
    lastSavedTitle.current = "";

    // Note: Editor content will be updated via the value prop in QuillEditor

    // Update display title and active note (minimal state changes)
    setDisplayTitle("");
    setActiveNote(newNote);
    setIsEditing(false); // Clear editing state for new note
  }, [generateDraftId]);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      // Check if this is a draft note (only exists in memory)
      if (noteId.startsWith("draft-")) {
        // For draft notes, just clear the active note and create a new one
        const newNote = {
          id: generateDraftId(),
          title: "",
          content: EMPTY_QUILL_CONTENT,
        };
        setActiveNote(newNote);
        setDisplayTitleSafe("");
        activeNoteIdRef.current = newNote.id;
        activeNoteRef.current = newNote;
        lastSavedContent.current = JSON.stringify(EMPTY_QUILL_CONTENT);
        lastSavedTitle.current = "";

        // Note: Editor content will be updated via the value prop in QuillEditor

        return; // Don't try to delete from database
      }

      // Find the note to delete
      const noteToDelete = notes.find((note) => note.id === noteId);
      if (!noteToDelete) return;

      try {
        // Optimistically remove from UI first
        const wasActive = activeNoteIdRef.current === noteId;

        // If this was the active note, create a new one
        if (wasActive) {
          const newNote = {
            id: generateDraftId(),
            title: "",
            content: EMPTY_QUILL_CONTENT,
          };
          setActiveNote(newNote);
          setDisplayTitleSafe("");
          activeNoteIdRef.current = newNote.id;
          activeNoteRef.current = newNote;
          lastSavedContent.current = JSON.stringify(EMPTY_QUILL_CONTENT);
          lastSavedTitle.current = "";

          // Note: Editor content will be updated via the value prop in QuillEditor
        }

        // Delete from database
        await deleteNote.mutate(noteId);

        // Show success toast with undo option
        sonnerToast.success("Note deleted", {
          description: `"${noteToDelete.title || "Untitled Note"}" has been deleted.`,
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                // Recreate the note using mutation
                await createNote.mutate({
                  title: noteToDelete.title,
                  content: noteToDelete.content,
                });

                sonnerToast.success("Note restored");
              } catch (error) {
                sonnerToast.error("Failed to restore note");
              }
            },
          },
          duration: 10000, // Give user 10 seconds to undo
        });
      } catch (error) {
        const errorMessage = (error as Error).message || "Please try again.";

        // If note was not found (404), treat it as already deleted
        if (
          errorMessage.includes("Note not found") ||
          errorMessage.includes("404")
        ) {
          sonnerToast.info("Note was already deleted");
          loadNotes(); // Refresh to sync
        } else {
          sonnerToast.error("Failed to delete note", {
            description: errorMessage,
          });
        }
      }
    },
    [deleteNote, notes, generateDraftId, setDisplayTitleSafe, loadNotes],
  );

  const handleDeleteActiveNote = useCallback(() => {
    if (activeNote?.id) {
      handleDeleteNote(activeNote.id as string);
    }
  }, [activeNote?.id, handleDeleteNote]);

  const handleToggleCollapse = useCallback(
    () => setIsCollapsed((prev) => !prev),
    [],
  );

  // Memoize computed values to prevent unnecessary re-renders
  const isNewNote = useMemo(() => {
    return activeNote?.id?.startsWith("draft-") ?? false;
  }, [activeNote?.id]);

  const selectedNoteId = useMemo(() => activeNote?.id, [activeNote?.id]);

  // Ensure only one note is selected at a time
  useEffect(() => {
    if (activeNote?.id) {
      // Clear any other selected notes
      // setSidebarNote(prev => prev && prev.id === activeNote.id ? prev : null) // Removed sidebar state
    }
  }, [activeNote?.id]);

  return (
    <WidgetContainer data-widget="notes">
      <link rel="stylesheet" href="/styles/quill-custom.css" />
      <ResizablePanels
        defaultWidth={300}
        collapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      >
        {/* Notes List */}
        <div className={notesStyles.notesListPanel}>
          <WidgetHeader title="Notes">
            <AddButton onClick={handleCreateNew} />
          </WidgetHeader>
          <div className={cn(notesStyles.notesListScroll, "custom-scrollbar")}>
            {isLoadingNotes ? (
              <WidgetLoader />
            ) : notes.length > 0 || activeNote ? (
              <div className={notesStyles.notesListContent}>
                <AnimatePresence>
                  {/* Show the active draft note (should be only one) */}
                  {activeNote && activeNote.id?.startsWith("draft-") && (
                    <>
                      <NoteListItem
                        key={activeNote.id}
                        note={
                          {
                            ...activeNote,
                            title: displayTitle, // Use live display title instead of stale activeNote.title
                            content:
                              activeNoteRef.current?.content ||
                              activeNote.content, // Use live content
                          } as Note
                        }
                        isSelected={true}
                        onClick={() => {}} // Already selected
                        onDelete={() =>
                          handleDeleteNote(activeNote.id as string)
                        }
                        collapsed={isCollapsed}
                        isEditing={isEditing}
                      />
                    </>
                  )}
                  {/* Then show all saved notes */}
                  {notes.map((note) => {
                    // Check if this saved note is the currently active note
                    // For saved notes, only show as active if activeNote is not a draft
                    const isActive =
                      !activeNote?.id?.startsWith("draft-") &&
                      activeNoteIdRef.current === note.id;

                    return (
                      <NoteListItem
                        key={note.id}
                        note={note}
                        isSelected={isActive}
                        onClick={() => handleSelectNote(note)}
                        onDelete={() => handleDeleteNote(note.id as string)}
                        collapsed={isCollapsed}
                        isEditing={isActive && isEditing}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                title="No Notes"
                description="Create your first note."
              />
            )}
          </div>
        </div>
        {/* Note Editor */}
        <div className={notesStyles.notesEditorPanel}>
          {activeNote ? (
            <div className={notesStyles.notesContentPanel}>
              {/* Header with Title and Actions - Fixed */}
              <div className={notesStyles.notesEditorHeader}>
                <div className={notesStyles.notesHeaderContent}>
                  {/* Title Input - Tab Index 1 */}
                  <div className={notesStyles.notesTitleContainer}>
                    <textarea
                      ref={(el) => {
                        if (el) {
                          (titleInputRef as any).current = el;
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }
                      }}
                      tabIndex={3}
                      className={notesStyles.notesTitleInput}
                      placeholder="Untitled note"
                      rows={1}
                      value={displayTitle}
                      onChange={(e) => {
                        handleTitleChange(e);
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                      onBlur={handleTitleBlur}
                    />
                  </div>
                  {/* Actions Menu - Tab Index 3 */}
                  <div tabIndex={2} className={notesStyles.notesActions}>
                    <ActionsMenu
                      onDelete={handleDeleteActiveNote}
                      isNewNote={isNewNote}
                    />
                  </div>
                </div>
              </div>
              {/* Save Status Indicator - Slides up from bottom */}
              {showSaveStatus && saveStatus !== "idle" && (
                <div
                  className={cn(
                    notesStyles.saveStatus,
                    notesStyles.saveStatusVisible,
                  )}
                >
                  {saveStatus === "saving" && (
                    <div
                      className={cn(
                        notesStyles.saveStatusContent,
                        notesStyles.saveStatusSaving,
                      )}
                    >
                      <div
                        className={cn(
                          notesStyles.saveStatusIndicator,
                          notesStyles.saveStatusIndicatorSaving,
                        )}
                      ></div>
                      Saving...
                    </div>
                  )}
                  {saveStatus === "saved" && (
                    <div
                      className={cn(
                        notesStyles.saveStatusContent,
                        notesStyles.saveStatusSaved,
                      )}
                    >
                      <div
                        className={cn(
                          notesStyles.saveStatusIndicator,
                          notesStyles.saveStatusIndicatorSaved,
                        )}
                      ></div>
                      Saved
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div
                      className={cn(
                        notesStyles.saveStatusContent,
                        notesStyles.saveStatusError,
                      )}
                    >
                      <div
                        className={cn(
                          notesStyles.saveStatusIndicator,
                          notesStyles.saveStatusIndicatorError,
                        )}
                      ></div>
                      Error
                    </div>
                  )}
                </div>
              )}

              {/* Content Editor - Scrollable - Tab Index 2 */}
              <div
                className={cn(
                  notesStyles.notesEditorScroll,
                  "custom-scrollbar",
                )}
                onClick={() => {
                  // Focus the Quill editor when clicking anywhere in the content area
                  const editorElement = document.querySelector('.ql-editor') as HTMLElement;
                  if (editorElement) {
                    editorElement.focus();
                  }
                }}
              >
                <DynamicQuillEditor
                  tabIndex={4}
                  key="stable-notes-editor" // Keep stable to prevent focus loss
                  value={activeNote?.content}
                  onChange={(content) => {
                    // Just piggyback off Quill's onChange - don't interfere with editing
                    if (!activeNoteRef.current) return;

                    console.log(
                      "QuillEditor onChange called for note:",
                      activeNoteRef.current.id,
                    );

                    // Update our data silently in background - NO STATE UPDATES
                    activeNoteRef.current = {
                      ...activeNoteRef.current,
                      content,
                    };

                    // Schedule background save (won't interrupt typing)
                    scheduleBackgroundSave();
                  }}
                  onBlur={() => {
                    // Save immediately on blur - cancel any pending background save
                    if (backgroundSaveTimeoutRef.current) {
                      clearTimeout(backgroundSaveTimeoutRef.current);
                    }
                    saveCurrentNote();
                  }}
                  editable={true}
                  className={notesStyles.notesEditorContainer}
                />
              </div>
            </div>
          ) : (
            <div className={notesStyles.notesEmptyState}>
              <p className={notesStyles.notesEmptyText}>
                Select or create a note.
              </p>
            </div>
          )}
        </div>
      </ResizablePanels>
    </WidgetContainer>
  );
}
