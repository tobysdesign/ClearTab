"use client";

import dynamic from "next/dynamic";

// Define the prop types for the Editor component
interface EditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  readOnly?: boolean;
  onOpenAiChat?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
}

// Dynamically import the Editor component with no SSR to avoid hydration issues
export const Editor = dynamic<EditorProps>(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] p-4 border border-gray-200 rounded-md flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading editor...</p>
    </div>
  ),
}); 