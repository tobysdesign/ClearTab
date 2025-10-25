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
import { WidgetHeader, WidgetContainer, WidgetLoader } from "@cleartab/ui";
import { EmptyState } from "@/components/ui/empty-state";
// import styles from "./widget.module.css";
import notesStyles from "@/components/widgets/notes-widget.module.css";
import { NoteListItem } from "@/components/widgets/note-list-item";
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

export function ExtensionNotesWidget() {
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
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const lastSavedContent = useRef<string>("");
  const lastSavedTitle = useRef<string>("");

  const activeNoteIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const draftCounterRef = useRef(0);
  const _editorInitializedRef = useRef(false);
  const editorRef = useRef<any>(null);
  const isUpdatingEditor = useRef(false);

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
      setNoteContent("");
      activeNoteIdRef.current = blankNote.id;
      lastSavedContent.current = "";
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
    if (!editorRef.current || !activeNote?.content) return;

    const content = activeNote.content || EMPTY_QUILL_CONTENT;
    const contentStr = JSON.stringify(content);

    // Only update if content actually changed to prevent unnecessary updates
    if (contentStr === lastSavedContent.current) return;

    isUpdatingEditor.current = true;

    try {
      editorRef.current.setContents(content);
      lastSavedContent.current = contentStr;
      lastSavedTitle.current = activeNote.title || "";

      // Sync display title with the note title when content updates (but not while user is typing)
      if (activeNote.title !== undefined && activeNote.title !== displayTitle) {
        setDisplayTitleSafe(activeNote.title);
      }
    } catch (error) {
      console.error("Failed to update editor content:", error);
    }

    // Use a longer timeout to ensure all editor updates are complete
    const timer = setTimeout(() => {
      isUpdatingEditor.current = false;
    }, 200);

    return () => clearTimeout(timer);
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

  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        // Show editing indicator
        setIsEditing(true);

        // Only update list for saved notes, not drafts (to prevent input focus issues)
        if (!activeNoteRef.current.id?.startsWith("draft-")) {
          updateNoteOptimistic(activeNoteRef.current.id, { title: newTitle });
        }
      });

      // Clear typing flag after user stops typing
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        isUserTypingRef.current = false;
      }, 2000);

      // Simple debounced save for title using same approach as body
      console.log("Title changed, scheduling save in 2 seconds...");
      clearTimeout((window as any).titleSaveTimeout);
      (window as any).titleSaveTimeout = setTimeout(async () => {
        const noteToSave = activeNoteRef.current;
        if (!noteToSave?.id || isSavingRef.current) return;

        const isDraft = noteToSave.id.startsWith("draft-");

        try {
          if (isDraft) {
            isSavingRef.current = true;
            setSaveStatus("saving");
            console.log("Creating new note from title:", noteToSave.title);
            // Create new note
            const response = await fetch("/api/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: noteToSave.title?.trim() || "Untitled Note",
                content: noteToSave.content,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                console.log(
                  "Title saved by creating new note:",
                  result.data.id,
                );
                // Update refs to point to the new saved note
                activeNoteIdRef.current = result.data.id;
                activeNoteRef.current = { ...noteToSave, id: result.data.id };

                // Update state to reflect the new saved note (but keep current display title)
                const currentDisplayTitle = displayTitle;
                setActiveNote({
                  ...noteToSave,
                  id: result.data.id,
                  title: currentDisplayTitle,
                });
                // Don't update displayTitle here to avoid clearing what user is typing

                // Immediately update the note in the list
                updateNoteOptimistic(result.data.id, {
                  title: result.data.title,
                  content: result.data.content,
                });

                setIsEditing(false);
                setSaveStatus("saved");

                // Refresh notes list to ensure persistence
                loadNotes();

                // Clear typing flag after save completes
                setTimeout(() => {
                  isUserTypingRef.current = false;
                  setSaveStatus("idle");
                }, 2000);
              }
            }
            isSavingRef.current = false;
          } else {
            console.log("Saving title:", noteToSave.title);
            const response = await fetch("/api/notes", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                noteId: noteToSave.id,
                title: noteToSave.title,
                content: noteToSave.content,
              }),
            });

            if (response.ok) {
              console.log("Title saved successfully");
              // Clear editing indicator
              setIsEditing(false);
            } else {
              const errorData = await response.json();
              console.error("Failed to save title:", errorData);
            }
          }
        } catch (error) {
          console.error("Title save failed:", error);
          isSavingRef.current = false;
        }
      }, 2000);
    },
    [],
  );

  const handleTitleBlur = useCallback(() => {
    if (!activeNoteRef.current) return;

    // Cancel pending debounced save and save immediately on blur
    clearTimeout((window as any).titleSaveTimeout);

    const currentNote = activeNoteRef.current;
    if (!currentNote.id?.startsWith("draft-") && currentNote.title) {
      fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: currentNote.id,
          title: currentNote.title,
          content: currentNote.content,
        }),
      })
        .then((response) => {
          if (response.ok) {
            console.log("Title saved on blur");
            // Clear editing indicator
            setIsEditing(false);
          }
        })
        .catch((error) => {
          console.error("Failed to save title on blur:", error);
        });
    }
  }, []);

  const handleSelectNote = useCallback((note: Note) => {
    setActiveNote(note);
    setDisplayTitleSafe(note.title || "");
    activeNoteIdRef.current = note.id;
    lastSavedContent.current = JSON.stringify(note.content);
    lastSavedTitle.current = note.title || "";

    // Sync editor content without re-rendering
    if (editorRef.current) {
      isUpdatingEditor.current = true;
      try {
        editorRef.current.setContents(note.content || EMPTY_QUILL_CONTENT);
      } catch (error) {
        console.error("Failed to update editor content:", error);
      }
      setTimeout(() => {
        isUpdatingEditor.current = false;
      }, 100);
    }
  }, []);

  // Force immediate save on blur (bypasses debouncing)
  const handleSaveOnBlur = useCallback(() => {
    // Simplified version that doesn't use React Query mutations to avoid refresh
    if (!activeNoteRef.current) return;

    // Just clear pending timeouts, let auto-save handle actual saving
    clearTimeout((window as any).contentSaveTimeout);
    clearTimeout((window as any).titleSaveTimeout);
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

  const handleCreateNew = useCallback(() => {
    // Clear any pending saves to avoid conflicts
    clearTimeout((window as any).contentSaveTimeout);
    clearTimeout((window as any).titleSaveTimeout);

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

    // Force editor to update with empty content
    if (editorRef.current) {
      isUpdatingEditor.current = true;
      editorRef.current.setContents(EMPTY_QUILL_CONTENT);
      setTimeout(() => {
        isUpdatingEditor.current = false;
      }, 200);
    }

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

        // Clear the editor
        if (editorRef.current) {
          isUpdatingEditor.current = true;
          editorRef.current.setContents(EMPTY_QUILL_CONTENT);
          setTimeout(() => {
            isUpdatingEditor.current = false;
          }, 200);
        }

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

          // Clear the editor
          if (editorRef.current) {
            isUpdatingEditor.current = true;
            editorRef.current.setContents(EMPTY_QUILL_CONTENT);
            setTimeout(() => {
              isUpdatingEditor.current = false;
            }, 200);
          }
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
                // Recreate the note
                const response = await fetch("/api/notes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: noteToDelete.title,
                    content: noteToDelete.content,
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  loadNotes(); // Refresh the list
                  sonnerToast.success("Note restored");
                } else {
                  throw new Error("Failed to restore note");
                }
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
                      tabIndex={1}
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
                  <div tabIndex={3} className={notesStyles.notesActions}>
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
              >
                <QuillEditor
                  key="notes-editor" // Use completely stable key to prevent any re-mounts
                  value={EMPTY_QUILL_CONTENT} // Always use empty, sync via effects
                  onChange={(content) => {
                    // Guard: check if we're updating programmatically
                    if (isUpdatingEditor.current) return;

                    // Guard: check if activeNote exists
                    if (!activeNoteRef.current) return;

                    // Mark user as actively typing
                    isUserTypingRef.current = true;

                    // Guard: prevent unnecessary saves if content hasn't changed
                    const contentStr = JSON.stringify(content);
                    if (contentStr === lastSavedContent.current) return;

                    // Detect if this is a significant change (large paste, etc.)
                    const previousContent = lastSavedContent.current
                      ? JSON.parse(lastSavedContent.current)
                      : EMPTY_QUILL_CONTENT;
                    const previousLength = JSON.stringify(previousContent).length;
                    const currentLength = contentStr.length;
                    const lengthDiff = Math.abs(currentLength - previousLength);
                    const isSignificantChange = lengthDiff > 100; // More than 100 chars changed (indicates paste/large edit)

                    // Update ref directly (no state changes)
                    const updatedNote = {
                      ...activeNoteRef.current,
                      content,
                    };
                    activeNoteRef.current = updatedNote;

                    // No forced re-render needed - content will update naturally through refs

                    // Show editing indicator
                    setIsEditing(true);

                    // Immediately update the note in the list (optimistic update)
                    if (!updatedNote.id?.startsWith("draft-")) {
                      updateNoteOptimistic(updatedNote.id, { content });
                    }

                    // Simple debounced save that only makes API calls
                    console.log(
                      "Content changed, scheduling save in 1 second...",
                    );
                    clearTimeout((window as any).contentSaveTimeout);
                    (window as any).contentSaveTimeout = setTimeout(
                      async () => {
                        const noteToSave = activeNoteRef.current;
                        if (!noteToSave?.id || isSavingRef.current) return;

                        const isDraft = noteToSave.id.startsWith("draft-");

                        try {
                          if (isDraft) {
                            isSavingRef.current = true;
                            if (isSignificantChange) {
                              setShowSaveStatus(true);
                              setSaveStatus("saving");
                            }
                            console.log("Creating new note:", noteToSave.title);
                            // Create new note
                            const response = await fetch("/api/notes", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                title:
                                  noteToSave.title?.trim() || "Untitled Note",
                                content: noteToSave.content,
                              }),
                            });

                            if (response.ok) {
                              const result = await response.json();
                              console.log("Note created successfully:", result);
                              // Update refs without state changes
                              activeNoteIdRef.current = result.data.id;
                              activeNoteRef.current = result.data;
                              lastSavedContent.current = JSON.stringify(
                                result.data.content,
                              );

                              // Update state to reflect the new saved note (preserve current title)
                              const currentDisplayTitle = displayTitle;
                              setActiveNote({
                                ...result.data,
                                title: currentDisplayTitle,
                              });
                              // Don't update displayTitle to avoid clearing what user is typing

                              // Clear editing indicator and set save status
                              setIsEditing(false);
                              if (isSignificantChange) {
                                setSaveStatus("saved");
                                setTimeout(() => {
                                  setSaveStatus("idle");
                                  setShowSaveStatus(false);
                                }, 2000);
                              }

                              // Refresh notes list to ensure persistence
                              loadNotes();

                              // Clear typing flag after save completes
                              setTimeout(() => {
                                isUserTypingRef.current = false;
                              }, 2000);
                            } else {
                              const errorData = await response.json();
                              console.error(
                                "Failed to create note:",
                                errorData,
                              );
                              if (isSignificantChange) {
                                setSaveStatus("error");
                                setTimeout(() => {
                                  setSaveStatus("idle");
                                  setShowSaveStatus(false);
                                }, 3000);
                              }
                            }
                            isSavingRef.current = false;
                          } else {
                            console.log(
                              "Updating existing note:",
                              noteToSave.id,
                            );
                            // Update existing note
                            const response = await fetch("/api/notes", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                noteId: noteToSave.id,
                                title: noteToSave.title,
                                content: noteToSave.content,
                              }),
                            });

                            if (response.ok) {
                              const result = await response.json();
                              console.log("Note updated successfully:", result);
                              lastSavedContent.current = JSON.stringify(
                                noteToSave.content,
                              );
                              // Clear editing indicator
                              setIsEditing(false);
                            } else {
                              const errorData = await response.json();
                              console.error(
                                "Failed to update note:",
                                errorData,
                              );
                            }
                          }
                        } catch (error) {
                          console.error("Save failed:", error);
                          isSavingRef.current = false;
                        }
                      },
                      1000,
                    );
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
