'use client'

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
}

export function NoteListItem({ note, isSelected, onClick, onDelete, collapsed = false, isRecentlyUpdated = false }: NoteListItemProps) {
  // Function to get a preview from Block[] content
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

  const preview = getBlocksPreview(note.content as Block[]);

  function getInitials(title: string) {
    const words = title.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (title.length > 0) {
      return title[0].toUpperCase();
    }
    return 'N'; // Default for empty title
  }

  // Check if title is empty or just "Untitled note"
  const isPlaceholderTitle = !note.title || note.title === "Untitled note" || note.title === "Untitled Note";

  if (collapsed) {
    return (
      <ClientOnly>
        <motion.div layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, y: isRecentlyUpdated ? [0, -20, 0] : 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30, duration: isRecentlyUpdated ? 0.5 : 0.3 }}
          className={cn("h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors", isSelected ? "bg-[#292929] border border-[#434343]" : "bg-[#222222] border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]", isRecentlyUpdated && "animate-promote")}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          title={note.title || "Untitled Note"}
        >
          <span className="font-bold text-xs">{getInitials(note.title || "Untitled Note")}</span>
        </motion.div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn("flex flex-col items-start w-full text-left rounded-lg p-3 mb-1 relative group transition-colors cursor-pointer border", isSelected ? "bg-[#292929] border-[#434343]" : "bg-[#222222] border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]", isRecentlyUpdated && "animate-highlight")}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <div className="flex justify-between w-full items-start notelist">
          <div className={cn(
            "font-inter-display font-medium text-[14px] leading-[17px] overflow-hidden truncate",
            isPlaceholderTitle ? "text-[#8D8D8D] italic" : "text-[#D2D2D2]"
          )}>
            {note.title || "Untitled Note"}
          </div>
          <div className="note subtitle flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0">...</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end"><DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="font-inter-display font-normal text-[14px] leading-[17px] text-[#8D8D8D] w-full overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
          {preview}
        </div>
      </motion.div>
    </ClientOnly>
  );
}
