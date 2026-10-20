"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
// import { Input } from "@/components/ui/input";

import { AddButton, Button } from "@cleartab/ui";
import dynamic from "next/dynamic";
import { flushSync } from "react-dom";
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
import { MoreActionsIcon, ChevronLeftIcon } from "@/components/icons";
import { useChatContext } from "@/hooks/use-chat-context";
import { useIsStacked } from "@/hooks/use-stacked-layout";
import { getDemoApi } from "@/lib/demo/mode";

// "Today, 4:12 am", "Yesterday, 9:03 pm", "5 Oct, 3:10 pm" (year only when it isn't this year)
function formatNoteDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
  return `${day}, ${time}`;
}
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
  /** Narrow screens: show only the list or only the editor, full width */
  stackedView?: "list" | "editor";
}

function ResizablePanels({
  children,
  defaultWidth = 300,
  minWidth = 50,
  maxWidth = 500,
  collapsed = false,
  onToggleCollapse,
  onWidthChange,
  stackedView,
}: ResizablePanelsProps) {
  const [currentWidth, setCurrentWidth] = useState(defaultWidth);
  const [containerWidth, setContainerWidth] = useState(0);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const collapseTriggered = useRef(false);
  // Animate width only for collapse/expand; automatic resizes (mount, window,
  // dashboard layout) snap, or every animation frame counts as a layout shift
  const [animateWidth, setAnimateWidth] = useState(false);
  // Compare with the previous value (not "first run"): StrictMode runs effects twice
  const previousCollapsed = useRef(collapsed);
  useEffect(() => {
    if (previousCollapsed.current === collapsed) return;
    previousCollapsed.current = collapsed;
    setAnimateWidth(true);
    const timer = setTimeout(() => setAnimateWidth(false), 200);
    return () => clearTimeout(timer);
  }, [collapsed]);

  // List gets 1/3 of the widget, capped at 40% so the editor keeps 60%
  const proportionalWidthFor = useCallback(
    (width: number) => Math.max(minWidth, Math.min(width / 3, Math.min(maxWidth, width * 0.4))),
    [minWidth, maxWidth],
  );

  // Size the list before the first paint. Waiting for the ResizeObserver painted it at
  // the 300px default first, then shrank it: the editor slid over and the header
  // re-wrapped, which was most of the dashboard's layout shift (CLS).
  useLayoutEffect(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    if (width <= 0) return;
    const proportional = proportionalWidthFor(width);
    setContainerWidth(width);
    setCurrentWidth(proportional);
    onWidthChange?.(proportional);
    // Mount only; the ResizeObserver below handles later size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // ResizeObserver callbacks run after layout but before paint. flushSync renders
    // the new width in that same frame; a normal state update painted the old
    // width first (e.g. 300px when the dashboard first became visible), then shifted.
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newContainerWidth = entry.contentRect.width;
        flushSync(() => {
          setContainerWidth(newContainerWidth);

          // Update currentWidth proportionally if not currently resizing
          if (!isResizing.current && newContainerWidth > 0) {
            const proportionalWidth = proportionalWidthFor(newContainerWidth);
            setCurrentWidth(proportionalWidth);
            onWidthChange?.(proportionalWidth);
          }
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [proportionalWidthFor, onWidthChange]);

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

  if (stackedView) {
    // Both stay mounted (the editor keeps autosaving); CSS shows one at a time
    return (
      <div className={notesStyles.stackedPanels} data-view={stackedView} ref={containerRef}>
        <div className={notesStyles.stackedPane}>{children[0]}</div>
        <div className={notesStyles.stackedPane}>{children[1]}</div>
      </div>
    );
  }

  return (
    <div className={notesStyles.resizablePanels} ref={containerRef}>
      <div
        // Until measured, CSS sizes the list with the same formula (no 300px first paint)
        style={containerWidth > 0 ? { width: currentWidth } : undefined}
        className={`${notesStyles.resizableLeft} ${currentWidth < 100 ? "collapsed" : ""}`}
        data-animate={animateWidth}
        data-settle
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
  // The first draft exists from the very first paint (created synchronously here, not in
  // a post-mount effect) so it is never *inserted* into an already-rendered sidebar list.
  // That late insertion is what shifted the list — on load, and again on the first
  // keystroke once we started hiding the empty draft. Present from frame one = no shift.
  const firstDraftIdRef = useRef(`draft-${Date.now()}-init`);
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(() => ({
    id: firstDraftIdRef.current,
    title: "",
    content: EMPTY_QUILL_CONTENT,
  }));
  // The persistent compose draft shown at the top of the list, decoupled from activeNote.
  // It stays rendered (keyed by its own draft id) even while a saved note is the active
  // note, so selecting a saved note never removes it → no "select" jump. On save it is
  // cleared and the just-saved note reuses the SAME key (via _clientKey), so the row
  // morphs in place at the top — no new untitled is spawned and nothing shifts.
  const [draftNote, setDraftNote] = useState<Partial<Note> | null>(() => ({
    id: firstDraftIdRef.current,
    title: "",
    content: EMPTY_QUILL_CONTENT,
  }));
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
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedContent = useRef<string>(JSON.stringify(EMPTY_QUILL_CONTENT));
  const lastSavedTitle = useRef<string>("");

  const activeNoteIdRef = useRef<string | null>(firstDraftIdRef.current);
  const isInitializedRef = useRef(true);
  const draftCounterRef = useRef(0);

  const triggerNoteHighlight = useCallback((noteId: string | null) => {
    if (!noteId) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedNoteId(noteId);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedNoteId(null);
    }, 7500);
  }, []);

  // Generate unique draft ID to prevent duplicate keys
  const generateDraftId = useCallback(() => {
    draftCounterRef.current += 1;
    return `draft-${Date.now()}-${draftCounterRef.current}`;
  }, []);

  // Load notes on mount (only once)
  useEffect(() => {
    loadNotes();
  }, []); // Remove loadNotes dependency to prevent refresh loops

  // Listen for delete-all events from settings
  useEffect(() => {
    const handleDeleteAll = (event: Event) => {
      const detail = (event as CustomEvent<{ domain: 'tasks' | 'notes' | 'voice' }>).detail;
      if (detail?.domain === 'notes') {
        console.log('📣 NotesWidget: Received delete-all event, refreshing...');
        loadNotes();
      }
    };

    const handleNoteCreated = (event: Event) => {
      const detail = (
        event as CustomEvent<{ data?: { id?: string }; source?: string }>
      ).detail;
      console.log('📣 NotesWidget: Received note-created event, refreshing...');
      loadNotes();
      triggerNoteHighlight(detail?.data?.id ?? null);
    };

    window.addEventListener('data-deleted-all', handleDeleteAll as EventListener);
    window.addEventListener('note-created', handleNoteCreated as EventListener);
    return () => {
      window.removeEventListener('data-deleted-all', handleDeleteAll as EventListener);
      window.removeEventListener('note-created', handleNoteCreated as EventListener);
    };
  }, [triggerNoteHighlight]); // Empty dependencies - loadNotes is stable from useNotes hook

  // Replace the active note with a fresh blank draft if it gets deleted elsewhere.
  // The first draft is created synchronously above, so there is no "initialize on load"
  // branch here anymore.
  useEffect(() => {
    if (isLoadingNotes) return;

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
      setDraftNote(newNote);
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
  const draftSaveInProgressRef = useRef<string | null>(null); // Track draft ID currently being saved

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
            // Check if this draft is already being saved (prevent duplicate creates)
            if (draftSaveInProgressRef.current === snapshot.id) {
              console.log("Draft save already in progress, skipping:", snapshot.id);
              return;
            }

            // Mark this draft as being saved
            draftSaveInProgressRef.current = snapshot.id;

            const savedNoteRaw = await createNote.mutate({
              title: currentTitle,
              content: normalizedContent,
              temporaryId: snapshot.id,
            });

            // Clear the draft save in progress flag
            draftSaveInProgressRef.current = null;

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

            // If this was the persistent top draft, clear it. Its just-saved twin reuses
            // the same list key (_clientKey === this draft id), so the top row morphs into
            // the saved note in place — no fresh untitled is generated and nothing shifts.
            setDraftNote((prev) =>
              prev && prev.id === snapshot.id ? null : prev,
            );

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
          // Clear draft save in progress flag on error
          if (snapshot.id?.startsWith("draft-")) {
            draftSaveInProgressRef.current = null;
          }
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

    // Schedule save ~2s after the last keystroke (debounce rapid typing). Longer so the
    // post-save sidebar re-render/jump doesn't fire during short pauses while you're working.
    // Don't capture snapshot here - capture it when timeout fires to get latest content
    backgroundSaveTimeoutRef.current = setTimeout(() => {
      // Create snapshot at save time to get the latest content
      const snapshot = createSaveSnapshot(activeNoteRef.current);
      if (!snapshot) return;

      saveCurrentNote(snapshot).catch((error) => {
        console.error("Background save failed:", error);
      });
    }, 2000);
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

  const pendingSelectNoteIdRef = useRef<string | null>(null);

  // Listen for select-note events (e.g. from recorder widget "View note" or auto-select on record stop)
  useEffect(() => {
    const handleSelectNoteEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; note?: Note }>).detail;
      if (!detail?.id) return;
      console.log('📣 NotesWidget: Received select-note event for note:', detail.id);
      triggerNoteHighlight(detail.id);
      const noteToSelect = notes.find((n) => n.id === detail.id) || detail.note;
      if (noteToSelect) {
        if (!notes.some((n) => n.id === noteToSelect.id)) {
          insertNoteAtIndex(noteToSelect as Note, 0);
        }
        handleSelectNote(noteToSelect as Note);
        setStackedView('editor');
      } else {
        pendingSelectNoteIdRef.current = detail.id;
        loadNotes();
      }
    };

    const handleNoteTranscribed = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; text?: string; content: any }>).detail;
      if (!detail?.id) return;
      console.log('📣 NotesWidget: Received note-transcribed for note:', detail.id);

      updateNoteOptimistic(detail.id, { content: detail.content });

      if (activeNoteRef.current?.id === detail.id) {
        const updated = {
          ...activeNoteRef.current,
          content: detail.content,
        };
        activeNoteRef.current = updated;
        setActiveNote(updated);
        lastSavedContent.current = JSON.stringify(detail.content);
      }
    };

    const handleNoteTranscriptionFailed = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; reason?: string; error?: string }>).detail;
      if (!detail?.id) return;
      console.log('📣 NotesWidget: Received note-transcription-failed for note:', detail.id);

      const failedContent = {
        status: detail.reason === 'out_of_credits' ? 'out_of_credits' : 'transcription_failed',
        error: detail.error,
        ops: [{ insert: '\n' }],
      };

      updateNoteOptimistic(detail.id, { content: failedContent });

      if (activeNoteRef.current?.id === detail.id) {
        const updated = {
          ...activeNoteRef.current,
          content: failedContent,
        };
        activeNoteRef.current = updated;
        setActiveNote(updated);
        lastSavedContent.current = JSON.stringify(failedContent);
      }
    };

    window.addEventListener('select-note', handleSelectNoteEvent as EventListener);
    window.addEventListener('note-transcribed', handleNoteTranscribed as EventListener);
    window.addEventListener('note-transcription-failed', handleNoteTranscriptionFailed as EventListener);
    return () => {
      window.removeEventListener('select-note', handleSelectNoteEvent as EventListener);
      window.removeEventListener('note-transcribed', handleNoteTranscribed as EventListener);
      window.removeEventListener('note-transcription-failed', handleNoteTranscriptionFailed as EventListener);
    };
  }, [notes, handleSelectNote, loadNotes, triggerNoteHighlight, insertNoteAtIndex, updateNoteOptimistic]);

  // If a note was pending selection after loading
  useEffect(() => {
    if (pendingSelectNoteIdRef.current && notes.length > 0) {
      const targetId = pendingSelectNoteIdRef.current;
      const found = notes.find((n) => n.id === targetId);
      if (found) {
        pendingSelectNoteIdRef.current = null;
        handleSelectNote(found);
        setStackedView('editor');
      }
    }
  }, [notes, handleSelectNote]);

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
    // This new draft becomes the persistent top-of-list compose row.
    setDraftNote(newNote);
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

  const { askAboutText, suggestTasks, createTasks } = useChatContext();

  // Plain text of the open note (title + body) for the AI
  const getActiveNoteText = useCallback(() => {
    const note = activeNoteRef.current ?? activeNote;
    const content = note?.content as unknown;
    const body =
      typeof content === "string"
        ? content
        : ((content as { ops?: Array<{ insert?: unknown }> })?.ops ?? [])
            .map((op) => (typeof op.insert === "string" ? op.insert : ""))
            .join("");
    return [note?.title, body.trim()].filter(Boolean).join("\n");
  }, [activeNote]);

  // Editor toolbar "+ Task": the highlighted text becomes a task
  const handleCreateTaskFromSelection = useCallback(
    async (text: string) => {
      try {
        const title = text.charAt(0).toUpperCase() + text.slice(1);
        await createTasks([{ title }]);
        if (!getDemoApi()) {
          sonnerToast.success("Added to Tasks", { description: text.slice(0, 80), duration: 2500 });
        }
      } catch (error) {
        console.error("NotesWidget: creating task from selection failed", error);
        if (!getDemoApi()) {
          sonnerToast.error("Couldn't add that task");
        }
      }
    },
    [createTasks],
  );

  const handleMakeTasksWithAi = useCallback(() => {
    const text = getActiveNoteText();
    if (!text) return;
    const title = activeNoteRef.current?.title || activeNote?.title;
    suggestTasks(text, title ? `Make tasks from “${title}”` : "Make tasks from this note");
  }, [getActiveNoteText, suggestTasks, activeNote?.title]);

  // Latest saved copy of the open note, so "Modified" reflects the last save
  const activeNoteDates = useMemo(() => {
    const saved = notes.find((n) => n.id === activeNote?.id) ?? activeNote;
    return {
      created: formatNoteDate(saved?.createdAt as Date | string | undefined),
      modified: formatNoteDate((saved?.updatedAt ?? saved?.createdAt) as Date | string | undefined),
    };
  }, [notes, activeNote]);

  // Narrow screens: list first, then a full-width editor with a back button
  const isStacked = useIsStacked();
  const [stackedView, setStackedView] = useState<"list" | "editor">("list");

  // Opening the editor adds a history entry, so the browser back button / Android back
  // gesture returns to the list instead of leaving the page. Next.js reloads on history
  // entries it doesn't recognise, so the entry keeps Next's state and adds a flag.
  const editorHistoryEntryRef = useRef(false);

  const showEditor = useCallback(() => {
    setStackedView("editor");
    if (isStacked && !editorHistoryEntryRef.current) {
      window.history.pushState({ ...window.history.state, cleartabNotesEditor: true }, "");
      editorHistoryEntryRef.current = true;
    }
  }, [isStacked]);

  // In-app back: go through history so the entry we added is used up
  const showList = useCallback(() => {
    if (editorHistoryEntryRef.current) {
      window.history.back();
    } else {
      setStackedView("list");
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!editorHistoryEntryRef.current) return;
      editorHistoryEntryRef.current = false;
      setStackedView("list");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openNote = useCallback(
    (note: Note) => {
      handleSelectNote(note);
      showEditor();
    },
    [handleSelectNote, showEditor],
  );

  const createAndOpenNote = useCallback(() => {
    handleCreateNew();
    showEditor();
  }, [handleCreateNew, showEditor]);

  // Re-open the existing persistent draft in the editor (no new draft created), used when
  // the draft row is shown but a saved note is currently the active note.
  const openDraft = useCallback(() => {
    if (!draftNote) return;
    const content = draftNote.content ?? EMPTY_QUILL_CONTENT;
    activeNoteIdRef.current = draftNote.id ?? null;
    activeNoteRef.current = draftNote;
    lastSavedContent.current = JSON.stringify(content);
    lastSavedTitle.current = draftNote.title || "";
    setActiveNote(draftNote);
    setDisplayTitle(draftNote.title || "");
    setIsEditing(false);
    showEditor();
  }, [draftNote, showEditor]);

  const handleDeleteActiveNote = useCallback(() => {
    if (activeNote?.id) {
      handleDeleteNote(activeNote.id as string);
      if (isStacked) showList();
    }
  }, [activeNote?.id, handleDeleteNote, isStacked, showList]);

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
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
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
        stackedView={isStacked ? stackedView : undefined}
      >
        {/* Notes List */}
        <div className={notesStyles.notesListPanel}>
          <WidgetHeader title="Notes">
            <AddButton onClick={createAndOpenNote} tooltip="Add note" />
          </WidgetHeader>
          <div className={notesStyles.notesListScroll}>
            {isLoadingNotes ? (
              <WidgetLoader />
            ) : notes.length > 0 || activeNote ? (
              <div className="ListContent">
                {/* popLayout: when an item leaves (e.g. the empty draft on switching notes),
                    it pops out of flow so the rest slide up smoothly instead of snapping. */}
                <AnimatePresence mode="popLayout">
                  {/* Draft (live, from activeNote) + saved notes in ONE keyed list. The draft
                      keys on its id; its just-saved note reuses that key via _clientKey, so the
                      element is kept across the draft→saved swap — no remount, no sidebar jump. */}
                  {(() => {
                    type Row = {
                      key: string;
                      isDraft: boolean;
                      isDraftActive: boolean;
                      note: Note;
                    };
                    const rows: Row[] = [];
                    // The persistent compose draft sits at the top, keyed by its own draft
                    // id. It survives opening a saved note (no "select" jump). When it is
                    // the active note it shows live edits; otherwise it shows its stored
                    // (usually empty) content. On save it is cleared and the just-saved
                    // note — which carries this same id as its _clientKey — takes this exact
                    // slot, so the row morphs in place: no new untitled, no shift.
                    if (draftNote?.id) {
                      const isDraftActive = activeNote?.id === draftNote.id;
                      rows.push({
                        key: draftNote.id,
                        isDraft: true,
                        isDraftActive,
                        note: (isDraftActive
                          ? {
                              ...draftNote,
                              title: displayTitle, // live title
                              content:
                                activeNoteRef.current?.content ||
                                draftNote.content, // live content
                            }
                          : draftNote) as Note,
                      });
                    }
                    for (const note of notes) {
                      const ck = (note as Note & { _clientKey?: string })._clientKey;
                      // While the draft is still shown, skip its just-saved twin so the key
                      // stays unique during the one-tick draft→saved handoff.
                      if (draftNote?.id && ck === draftNote.id) continue;
                      rows.push({
                        key: ck ?? (note.id as string),
                        isDraft: false,
                        isDraftActive: false,
                        note,
                      });
                    }
                    return rows.map(({ key, isDraft, isDraftActive, note }) => {
                      const isActive =
                        !isDraft && activeNoteIdRef.current === note.id;
                      return (
                        <NoteListItem
                          key={key}
                          note={note}
                          suppressEntrance={isDraft}
                          reservePreview={isDraft}
                          isSelected={isDraft ? isDraftActive : isActive}
                          onClick={
                            isDraft
                              ? isDraftActive
                                ? showEditor
                                : openDraft
                              : () => openNote(note)
                          }
                          onDelete={
                            isDraft
                              ? () => handleDeleteNote(draftNote?.id as string)
                              : () => handleDeleteNote(note.id as string)
                          }
                          collapsed={!isStacked && panelWidth < 100}
                          isRecentlyUpdated={!isDraft && highlightedNoteId === note.id}
                          isEditing={
                            isDraft ? isDraftActive && isEditing : isActive && isEditing
                          }
                          isDeleting={deletingNoteId === note.id}
                        />
                      );
                    });
                  })()}
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
                  {isStacked && (
                    <div className={notesStyles.notesBack}>
                      <Button
                        variant="ghost-icon"
                        size="icon"
                        tooltipLabel="All notes"
                        aria-label="Back to all notes"
                        onClick={showList}
                      >
                        <ChevronLeftIcon size={18} />
                      </Button>
                    </div>
                  )}
                  {/* Title section: label + input - Tab Index 1 */}
                  <div className={notesStyles.notesTitleSection}>
                    <span className={notesStyles.notesSectionLabel}>Title</span>
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
                  </div>
                  {/* Actions Menu - Tab Index 3 */}
                  <div tabIndex={2} className={notesStyles.notesActions}>
                    <SimpleDropdown
                      trigger={
                        <Button variant="ghost" size="icon" tooltipLabel="More actions" mini>
                          <MoreActionsIcon size={16} />
                        </Button>
                      }
                    >
                      <SimpleDropdownItem onClick={handleMakeTasksWithAi}>
                        Make tasks with AI
                      </SimpleDropdownItem>
                      <SimpleDropdownItem
                        onClick={handleDeleteActiveNote}
                        disabled={isNewNote}
                      >
                        Delete
                      </SimpleDropdownItem>
                      <div className={notesStyles.noteMetaMenu}>
                        {activeNoteDates.created ? (
                          <>
                            <div className={notesStyles.noteMetaRow}>
                              <span className={notesStyles.noteMetaLabel}>Created</span>
                              <span>{activeNoteDates.created}</span>
                            </div>
                            <div className={notesStyles.noteMetaRow}>
                              <span className={notesStyles.noteMetaLabel}>Modified</span>
                              <span>{activeNoteDates.modified}</span>
                            </div>
                          </>
                        ) : (
                          <div className={notesStyles.noteMetaRow}>Not saved yet</div>
                        )}
                      </div>
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

              {/* Contents section label */}
              <span
                className={cn(
                  notesStyles.notesSectionLabel,
                  notesStyles.notesContentsLabel,
                )}
              >
                Contents
              </span>
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
                {(() => {
                  const activeContent = activeNoteRef.current?.content || activeNote?.content;
                  let contentObj = activeContent;
                  if (typeof contentObj === "string") {
                    try {
                      contentObj = JSON.parse(contentObj);
                    } catch {
                      contentObj = null;
                    }
                  }
                  const isTranscribing = (contentObj as any)?.status === "transcribing";
                  const isOutOfCredits = (contentObj as any)?.status === "out_of_credits";

                  if (isTranscribing) {
                    const engine = (contentObj as any)?.engine as string | undefined;
                    const engineCopy =
                      engine === "local-en"
                        ? "Transcription using English model on device"
                        : engine === "local-multi"
                          ? "Transcription using multilingual model on device"
                          : engine === "gemini"
                            ? "Transcription using Gemini (cloud)"
                            : "Transcription in progress";
                    return (
                      <div className={notesStyles.inNoteTranscribingCard}>
                        <span className={notesStyles.inNoteTranscribingTitle}>
                          Transcribing voice note...
                        </span>
                        <div className={notesStyles.inNoteProgressTrack}>
                          <div className={notesStyles.inNoteProgressFill} />
                        </div>
                        <p className={notesStyles.inNoteSubtitle}>{engineCopy}</p>
                      </div>
                    );
                  }

                  if (isOutOfCredits) {
                    return (
                      <div className={notesStyles.outOfCreditsCard}>
                        <div className={notesStyles.outOfCreditsHeader}>
                          <div className={notesStyles.outOfCreditsTitleGroup}>
                            <span className={notesStyles.outOfCreditsIcon}>⚡</span>
                            <h4 className={notesStyles.outOfCreditsTitle}>
                              Out of transcription credits
                            </h4>
                          </div>
                        </div>
                        <p className={notesStyles.outOfCreditsDesc}>
                          You have used your transcription credits for this period. Add credits to transcribe this recording and future voice notes.
                        </p>
                        <div className={notesStyles.outOfCreditsActions}>
                          <Button
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Transcription Credits",
                                description: "ClearTab Pro voice credits coming soon! Free local transcription enabled.",
                              });
                            }}
                          >
                            Add credits
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (activeNote?.id) {
                                const emptyContent = EMPTY_QUILL_CONTENT;
                                updateNote.mutate({ id: activeNote.id as string, content: emptyContent });
                                const updated = { ...activeNote, content: emptyContent };
                                setActiveNote(updated);
                                activeNoteRef.current = updated;
                              }
                            }}
                          >
                            Write note manually
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
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

                        // Save immediately on every change (debounced internally)
                        scheduleBackgroundSave();
                      }}
                      editable={true}
                      onOpenAiChat={askAboutText}
                      onCreateTask={handleCreateTaskFromSelection}
                      className={notesStyles.notesEditorContainer}
                    />
                  );
                })()}
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
