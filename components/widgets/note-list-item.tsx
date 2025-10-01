'use client'

import React, { useMemo, useCallback } from 'react'
import { ClientOnly } from '@/components/ui/safe-motion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Block } from '@blocknote/core'

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

export const NoteListItem = React.memo(function NoteListItem({ note, isSelected, onClick, onDelete, collapsed = false, isRecentlyUpdated = false, isEditing = false }: NoteListItemProps) {
  // Memoized function to get a preview from Block[] content
  const preview = useMemo(() => {
    function getBlocksPreview(blocks: any): string {
      if (!blocks || blocks.length === 0) return "Empty note";

      // Concatenate text content from all blocks for a preview
      try {
        const previewText = blocks.map((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content.map((item: any) =>
              typeof item === 'object' && item.type === 'text' && item.text ? item.text : ''
            ).join('');
          }
          return '';
        }).join(' ');

        return previewText.trim() === '' ? "Empty note" : previewText.substring(0, 100) + (previewText.length > 100 ? '...' : '');
      } catch (error) {
        console.error("Error generating preview:", error);
        return "Error generating preview";
      }
    }

    return getBlocksPreview(note.content as Block[]);
  }, [note.content]);

  // Memoized function to get initials
  const initials = useMemo(() => {
    function getInitials(title: string) {
      const words = title.split(' ');
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      } else if (title.length > 0) {
        return title[0].toUpperCase();
      }
      return 'N'; // Default for empty title
    }

    return getInitials(note.title || "Untitled Note");
  }, [note.title]);

  // Memoized check if title is empty or just "Untitled note"
  const isPlaceholderTitle = useMemo(() => {
    return !note.title || note.title === "Untitled note" || note.title === "Untitled Note";
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
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  if (collapsed) {
    return (
      <ClientOnly>
        <motion.div layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, y: isRecentlyUpdated ? [0, -20, 0] : 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30, duration: isRecentlyUpdated ? 0.5 : 0.3 }}
          className={cn("h-10 w-10 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors relative", isSelected ? "bg-[#292929] border border-[#434343]" : "bg-[#222222] border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]", isRecentlyUpdated && "animate-promote")}
          onClick={handleClick}
          title={displayText}
        >

          <span className="font-bold text-xs text-[#c4c4c4]">{initials}</span>
        </motion.div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn("widget-list-item widget-list-item--notes flex flex-col items-start w-full text-left rounded-lg p-3 mb-1 relative group transition-colors cursor-pointer border", isSelected && "widget-list-item--active", isRecentlyUpdated && "animate-highlight")}
        onClick={handleClick}
      >


        <div className="flex justify-between w-full items-start notelist">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "font-inter-display overflow-hidden truncate flex-1",
              shouldShowAsPlaceholder
                ? "font-medium text-[14px] text-[#5c5c5c] italic"
                : note.title && note.title.trim() !== ""
                  ? "font-medium text-[14px] text-[#c4c4c4]" // Title styles
                  : "font-normal text-[12px] text-[#c4c4c4]" // Content as title styles
            )}>
              {displayText}
            </div>
            {isEditing && (
              <div className="flex-shrink-0">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
        {/* Only show preview if we're showing a title (not content as title) */}
        {note.title && note.title.trim() !== "" && (
          <div className="font-inter-display font-normal text-[12px] leading-[15px] text-[#8D8D8D] w-full overflow-hidden note-preview">
            {preview}
          </div>
        )}
      </motion.div>
    </ClientOnly>
  );
});
