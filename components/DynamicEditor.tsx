"use client";

import React from "react";
import dynamic from "next/dynamic";
import styles from './dynamic-editor.module.css';

// Define types for editor content
type EditorContent = Record<string, unknown> | null;

// Define the prop types for the Editor component
interface EditorProps {
  initialContent?: EditorContent;
  onChange?: (content: EditorContent) => void;
  readOnly?: boolean;
  onOpenAiChat?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
}

// Dynamically import the Editor component with no SSR to avoid hydration issues
export const Editor = dynamic<EditorProps>(
  () => import("./ui/editor").then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading editor...</p>
      </div>
    ),
  }
); 