"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
// import { Input } from "@/components/ui/input";

import { AddButton, Button } from "@cleartab/ui";
import dynamic from "next/dynamic";
import type { Note } from "@/shared/schema";
import { useNotes } from "@/hooks/use-notes";
import { EMPTY_QUILL_CONTENT } from "@/lib/quill-utils";
import { WidgetHeader, WidgetContainer, WidgetLoader } from "@cleartab/ui";
import { AnimatePresence } from "framer-motion";

const DynamicQuillEditor = dynamic(
  () => import("@/components/ui/quill-editor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => null,
  },
);
import { EmptyState } from "@cleartab/ui";
// import styles from "./widget.module.css";
import notesStyles from "./notes-widget.module.css";
import { NoteListItem } from "./note-list-item";
import { cn } from "@/lib/utils";
import { SimpleDropdown, SimpleDropdownItem } from "@cleartab/ui";
import { useToast } from "@cleartab/ui";
import { toast as sonnerToast } from "sonner";
import { MoreActionsIcon } from "@/components/icons";
// import { useDebounce } from "@/hooks/use-debounce";
// import { api } from "@/lib/api-client";

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

  useEffect(() => {
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
  useEffect(() => {
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

// Helper for deep equality check (for content)
function _isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeNoteContent(
  content: Note["content"] | string | null | undefined,
) {
  if (!content) return EMPTY_QUILL_CONTENT;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch (error) {
      // console.error("Failed to parse            :", error);
      return EMPTY_QUILL_CONTENT;
    }
  }
  return content;
}

function createSaveSnapshot(
  note: Partial<Note> | null | undefined,
): (Partial<Note> & { content: Note["content"] }) | null {
  if (!note) return null;
  const normalizedContent = normalizeNoteContent(note.content);
  let clonedContent = normalizedContent;

  try {
    clonedContent = JSON.parse(JSON.stringify(normalizedContent));
  } catch (error) {
    console.error("Failed to clone note content for saving:", error);
  }

  return {
    ...note,
    content: clonedContent ?? EMPTY_QUILL_CONTENT,
  };
}

type SavedNoteSnapshot = {
  note: Note;
  index: number;
  wasActive: boolean;
};

type PendingDeleteOperation = {
  snapshot: SavedNoteSnapshot;
  toastId: string | number;
  timeout: ReturnType<typeof setTimeout>;
};

export function NotesWidget() {
  const {
    notes,
    createNote,
    updateNote,
    deleteNote,
    isLoadingNotes,
    loadNotes,
    updateNoteOptimistic,
    removeNoteOptimistic,
    insertNoteAtIndex,
  } = useNotes();
  const { toast } = useToast();
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(null);
  const [displayTitle, setDisplayTitle] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(300);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
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
  const ongoingSaveRef = useRef<Promise<void> | null>(null);
  const isUserTypingRef = useRef(false); // Prevent reloads while user is typing
  const pendingDeletesRef = useRef<Map<string, PendingDeleteOperation>>(
    new Map(),
  );
  const backgroundSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const restoreActiveNoteState = useCallback(
    (note: Note) => {
      const normalizedContent = normalizeNoteContent(note.content);
      const normalizedNote = { ...note, content: normalizedContent };
      isUserTypingRef.current = false;
      activeNoteIdRef.current = normalizedNote.id || null;
      activeNoteRef.current = normalizedNote;
      setActiveNote(normalizedNote);
      setDisplayTitle(normalizedNote.title || "");
      lastSavedContent.current = JSON.stringify(normalizedContent);
      lastSavedTitle.current = normalizedNote.title || "";
      setIsEditing(false);
      setShowSaveStatus(false);
      setSaveStatus("idle");
    },
    [setActiveNote],
  );

  const cancelPendingDelete = useCallback(
    (noteId: string) => {
      const pending = pendingDeletesRef.current.get(noteId);
      if (!pending) return;

      clearTimeout(pending.timeout);
      sonnerToast.dismiss(pending.toastId);
      pendingDeletesRef.current.delete(noteId);

      insertNoteAtIndex(pending.snapshot.note, pending.snapshot.index);
      if (pending.snapshot.wasActive) {
        restoreActiveNoteState(pending.snapshot.note);
      }
      setDeletingNoteId(null);
      sonnerToast.info("Deletion cancelled", { duration: 2000 });
    },
    [insertNoteAtIndex, restoreActiveNoteState],
  );

  // Unified save function
  const saveCurrentNote = useCallback(
    async (noteOverride?: Partial<Note>) => {
      const snapshot = createSaveSnapshot(
        noteOverride ?? activeNoteRef.current,
      );
      if (!snapshot) return;

      const normalizedContent = snapshot.content ?? EMPTY_QUILL_CONTENT;
      const isContentEmpty = _isEqual(normalizedContent, EMPTY_QUILL_CONTENT);
      const isTitleEmpty = !snapshot.title || snapshot.title.trim() === "";

      // If it's a new note (draft) and both title and content are empty, don't save.
      if (snapshot.id?.startsWith("draft-") && isTitleEmpty && isContentEmpty) {
        return;
      }

      const runSave = async () => {
        const isDraft = snapshot.id?.startsWith("draft-");
        const currentTitle = snapshot.title?.trim() || "Untitled Note";

        try {
          if (isDraft) {
            const savedNoteRaw = await createNote.mutate({
              title: currentTitle,
              content: normalizedContent,
              temporaryId: snapshot.id,
            });

            const parsedContent = normalizeNoteContent(savedNoteRaw.content);
            const savedNote = { ...savedNoteRaw, content: parsedContent };
            const isStillActive = activeNoteIdRef.current === snapshot.id;

            if (isStillActive) {
              activeNoteIdRef.current = savedNote.id;
              activeNoteRef.current = savedNote;
              setActiveNote(savedNote);
              setDisplayTitleSafe(savedNote.title || "");
              lastSavedContent.current = JSON.stringify(parsedContent);
              lastSavedTitle.current = savedNote.title || "";
            }

            console.log("Note saved (was draft):", savedNote.id);
          } else {
            const savedNoteRaw = await updateNote.mutate({
              id: snapshot.id as string,
              title: snapshot.title,
              content: normalizedContent,
            });

            if (savedNoteRaw) {
              const parsedContent = normalizeNoteContent(savedNoteRaw.content);
              const savedNote = { ...savedNoteRaw, content: parsedContent };
              const isStillActive = activeNoteIdRef.current === savedNote.id;

              if (isStillActive) {
                setActiveNote(savedNote);
                activeNoteRef.current = savedNote;
                setDisplayTitleSafe(savedNote.title || "");
                lastSavedContent.current = JSON.stringify(parsedContent);
                lastSavedTitle.current = savedNote.title || "";
              }

              console.log("Note saved (existing):", savedNote.id);
            }
          }
        } catch (error) {
          console.error("Failed to save note:", error);
          toast({
            title: snapshot.id?.startsWith("draft-")
              ? "Failed to create note"
              : "Failed to save note",
            description: (error as Error).message || "Please try again.",
            variant: "destructive",
          });
          throw error;
        }
      };

      const previous = ongoingSaveRef.current ?? Promise.resolve();
      const chainedSave = previous
        .catch(() => undefined) // ensure chain continues after rejection
        .then(() => runSave());

      ongoingSaveRef.current = chainedSave.finally(() => {
        if (ongoingSaveRef.current === chainedSave) {
          ongoingSaveRef.current = null;
        }
      });

      await chainedSave;
    },
    [createNote, updateNote, setActiveNote, setDisplayTitleSafe, toast],
  );

  const handleUndoDelete = useCallback(
    (snapshot: SavedNoteSnapshot) => {
      const normalizedContent = normalizeNoteContent(snapshot.note.content);
      const restoredDraft = {
        ...snapshot.note,
        id: generateDraftId(),
        content: normalizedContent,
      };

      activeNoteIdRef.current = restoredDraft.id;
      activeNoteRef.current = restoredDraft;
      setActiveNote(restoredDraft);
      isUserTypingRef.current = false;
      setDisplayTitle(restoredDraft.title || "");
      lastSavedContent.current = JSON.stringify(normalizedContent);
      lastSavedTitle.current = restoredDraft.title || "";
      setIsEditing(false);
      setShowSaveStatus(false);
      setSaveStatus("idle");

      if (backgroundSaveTimeoutRef.current) {
        clearTimeout(backgroundSaveTimeoutRef.current);
      }

      saveCurrentNote(restoredDraft)
        .then(() => {
          sonnerToast.success("Note restored", { duration: 2000 });
        })
        .catch((error) => {
          console.error("Failed to restore note after undo:", error);
          sonnerToast.error("Failed to restore note", {
            description: (error as Error).message || "Please try again.",
          });
        });
    },
    [generateDraftId, saveCurrentNote],
  );

  // Background save system - completely decoupled from user input

  const scheduleBackgroundSave = useCallback(() => {
    // Clear any existing timeout
    if (backgroundSaveTimeoutRef.current) {
      clearTimeout(backgroundSaveTimeoutRef.current);
    }

    // Schedule save for 3 seconds from now
    const snapshot = createSaveSnapshot(activeNoteRef.current);
    if (!snapshot) return;

    backgroundSaveTimeoutRef.current = setTimeout(() => {
      // Only save if there are actual changes and user isn't actively typing
      if (!isUserTypingRef.current) {
        saveCurrentNote(snapshot).catch((error) => {
          console.error("Background save failed:", error);
        });
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

        // Update ref AND state to preserve content
        activeNoteRef.current = { ...activeNoteRef.current, title: newTitle };

        // Update activeNote state to keep editor content in sync
        setActiveNote((prev) => (prev ? { ...prev, title: newTitle } : prev));

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
    saveCurrentNote().catch((error) => {
      console.error("Failed to save note on title blur:", error);
    });
  }, [saveCurrentNote]);

  const handleSelectNote = useCallback(
    (note: Note) => {
      // First, save the current note if there is one and it has changes
      const currentSnapshot =
        activeNoteRef.current && activeNoteRef.current.id !== note.id
          ? createSaveSnapshot(activeNoteRef.current)
          : null;

      if (currentSnapshot) {
        saveCurrentNote(currentSnapshot).catch((error) => {
          console.error("Failed to save current note before switching:", error);
        });
      }

      // Parse content if it's a string (from API), otherwise use as-is
      const parsedContent = normalizeNoteContent(note.content);
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
        saveCurrentNote().catch((error) => {
          console.error("Failed to save note on beforeunload:", error);
        });
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
    (noteId: string) => {
      if (pendingDeletesRef.current.has(noteId)) {
        return;
      }

      // Draft notes live only in memory – treat delete as discard
      if (noteId.startsWith("draft-")) {
        handleCreateNew();
        sonnerToast.info("Draft discarded", { duration: 2000 });
        return;
      }

      const noteIndex = notes.findIndex((note) => note.id === noteId);
      if (noteIndex === -1) return;

      const noteToDelete = notes[noteIndex];
      const normalizedNote: Note = {
        ...noteToDelete,
        content: normalizeNoteContent(noteToDelete.content),
      };
      const wasActive = activeNoteIdRef.current === noteId;

      removeNoteOptimistic(noteId);
      setDeletingNoteId(noteId);

      if (wasActive) {
        handleCreateNew();
      }

      const snapshot: SavedNoteSnapshot = {
        note: normalizedNote,
        index: noteIndex,
        wasActive,
      };

      const toastId = sonnerToast("Deleting note...", {
        action: {
          label: "Cancel",
          onClick: () => cancelPendingDelete(noteId),
        },
        duration: Infinity,
      });

      const timeout = setTimeout(async () => {
        try {
          await deleteNote.mutate(noteId);
          pendingDeletesRef.current.delete(noteId);
          sonnerToast.dismiss(toastId);
          setDeletingNoteId(null);
          sonnerToast.success("Note deleted!", {
            action: {
              label: "Undo",
              onClick: () => handleUndoDelete(snapshot),
            },
            duration: 4000,
          });
        } catch (error) {
          console.error("Failed to delete note:", error);
          pendingDeletesRef.current.delete(noteId);
          sonnerToast.dismiss(toastId);
          insertNoteAtIndex(snapshot.note, snapshot.index);
          if (snapshot.wasActive) {
            restoreActiveNoteState(snapshot.note);
          }
          setDeletingNoteId(null);
          sonnerToast.error("Note deletion failed.", {
            action: {
              label: "Retry",
              onClick: () => handleDeleteNote(noteId),
            },
            duration: 4000,
          });
        }
      }, 1200);

      pendingDeletesRef.current.set(noteId, { snapshot, toastId, timeout });
    },
    [
      notes,
      deleteNote,
      removeNoteOptimistic,
      insertNoteAtIndex,
      restoreActiveNoteState,
      handleCreateNew,
      cancelPendingDelete,
      handleUndoDelete,
    ],
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

  useEffect(() => {
    return () => {
      pendingDeletesRef.current.forEach(({ timeout }) => clearTimeout(timeout));
      pendingDeletesRef.current.clear();
    };
  }, []);

  return (
    <WidgetContainer className="notes-widget" data-widget="notes">
      <link rel="stylesheet" href="/styles/quill-custom.css" />
      <ResizablePanels
        defaultWidth={300}
        collapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onWidthChange={setPanelWidth}
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
              <div className="ListContent">
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
                        collapsed={panelWidth < 100}
                        isEditing={isEditing}
                        isDeleting={deletingNoteId === activeNote.id}
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
                        collapsed={panelWidth < 100}
                        isEditing={isActive && isEditing}
                        isDeleting={deletingNoteId === note.id}
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
                    <SimpleDropdown
                      trigger={
                        <Button variant="ghost-icon" size="icon">
                          <MoreActionsIcon size={16} />
                        </Button>
                      }
                    >
                      <SimpleDropdownItem
                        onClick={handleDeleteActiveNote}
                        disabled={isNewNote}
                      >
                        Delete
                      </SimpleDropdownItem>
                    </SimpleDropdown>
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
                  const editorElement = document.querySelector(
                    ".ql-editor",
                  ) as HTMLElement;
                  if (editorElement) {
                    editorElement.focus();
                  }
                }}
              >
                <DynamicQuillEditor
                  tabIndex={4}
                  key="stable-notes-editor" // Keep stable to prevent focus loss
                  value={activeNoteRef.current?.content || activeNote?.content}
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
                    saveCurrentNote().catch((error) => {
                      console.error(
                        "Failed to save note on editor blur:",
                        error,
                      );
                    });
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
