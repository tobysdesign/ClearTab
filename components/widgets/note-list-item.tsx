"use client";

import React, { useMemo, useCallback } from "react";
import { ClientOnly } from "@/components/ui/safe-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from './note-list-item.module.css';


interface NoteListItemProps {
  note: {
    id: string;
    title: string;
    content: any;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  collapsed?: boolean;
  isRecentlyUpdated?: boolean;
  isEditing?: boolean;
}

export const NoteListItem = React.memo(function NoteListItem({
  note,
  isSelected,
  onClick,
  onDelete,
  collapsed = false,
  isRecentlyUpdated = false,
  isEditing = false,
}: NoteListItemProps) {
  // Memoized function to get a preview from Block[] content
  const preview = useMemo(() => {
    function getContentPreview(content: any): string {
      if (!content) return "Empty note";

      try {
        // If content is a string, try to parse it
        let parsedContent;
        if (typeof content === "string") {
          parsedContent = JSON.parse(content);
        } else {
          parsedContent = content;
        }

        // Handle Quill delta format
        if (parsedContent.ops && Array.isArray(parsedContent.ops)) {
          const previewText = parsedContent.ops
            .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
            .join("")
            .replace(/\n/g, " ")
            .trim();
          return previewText === ""
            ? "Empty note"
            : previewText.substring(0, 100) +
                (previewText.length > 100 ? "..." : "");
        }


        return "Empty note";
      } catch (error) {
        console.error("Error generating preview:", error);
        return "Error generating preview";
      }
    }

    return getContentPreview(note.content);
  }, [note.content]);

  // Memoized function to get initials
  const initials = useMemo(() => {
    function getInitials(title: string) {
      const words = title.split(" ").filter((w) => w.length > 0);
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1) {
        return words[0][0].toUpperCase();
      }
      return "N"; // Default for empty title
    }

    return getInitials(note.title || "Untitled Note");
  }, [note.title]);

  // Memoized check if title is empty or just "Untitled note"
  const isPlaceholderTitle = useMemo(() => {
    return (
      !note.title ||
      note.title === "Untitled note" ||
      note.title === "Untitled Note"
    );
  }, [note.title]);

  // Determine what to show in the list - title or content
  const displayText = useMemo(() => {
    if (note.title && note.title.trim() !== "") {
      return note.title;
    }
    // If no title but has content, show content preview
    if (preview && preview !== "Empty note") {
      return preview;
    }
    // Otherwise show placeholder
    return "Untitled note";
  }, [note.title, preview]);

  const shouldShowAsPlaceholder = useMemo(() => {
    return displayText === "Untitled note";
  }, [displayText]);

  // Memoized event handlers to prevent re-creation on every render
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  if (collapsed) {
    return (
      <ClientOnly>
        <motion.div
          layout
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: isRecentlyUpdated ? [0, -20, 0] : 0,
          }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            duration: isRecentlyUpdated ? 0.5 : 0.3,
          }}
          className={cn(
            styles.collapsedItem,
            isSelected
              ? styles.collapsedItemSelected
              : styles.collapsedItemDefault,
            isRecentlyUpdated && "animate-promote",
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          title={displayText}
        >
          <span className={styles.collapsedInitials}>{initials}</span>
        </motion.div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <motion.div
        layout
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "widget-list-item widget-list-item--notes",
          styles.expandedItem,
          isSelected && "widget-list-item--active",
          isRecentlyUpdated && "animate-highlight",
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className={styles.itemHeader}>
          <div className={styles.itemContent}>
            <div
              className={cn(
                styles.itemTitle,
                shouldShowAsPlaceholder
                  ? styles.titlePlaceholder
                  : note.title && note.title.trim() !== ""
                    ? styles.titleActive // Title styles
                    : styles.titleContent, // Content as title styles
              )}
            >
              {displayText}
            </div>
            {isEditing && (
              <div className={styles.editingIndicator}>
                <div className={styles.editingDot} />
              </div>
            )}
          </div>
        </div>
        {/* Only show preview if we're showing a title (not content as title) */}
        {note.title && note.title.trim() !== "" && (
          <div className={styles.itemPreview}>
            {preview}
          </div>
        )}
      </motion.div>
    </ClientOnly>
  );
});
