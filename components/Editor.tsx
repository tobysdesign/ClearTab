"use client"; // this registers <Editor> as a Client Component
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useState, useCallback } from "react";
import { Bot, Sparkles, Wand2, ListTodo } from "lucide-react";
import { getAiResponse, aiCommands } from "@/components/ai-editor-integration";

// Editor props to handle content changes
interface EditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  readOnly?: boolean;
  onOpenAiChat?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
}

// Our <Editor> component we can reuse later
export default function Editor({ 
  initialContent, 
  onChange, 
  readOnly = false,
  onOpenAiChat,
  onCreateTask
}: EditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Function to handle AI assistance requests
  const handleAiAssist = useCallback(async (promptText: string, insertCallback: (content: string) => void) => {
    try {
      setIsAiLoading(true);
      // Call our AI integration helper
      const response = await getAiResponse(promptText);
      insertCallback(response);
    } catch (error) {
      console.error("Error getting AI assistance:", error);
      insertCallback("Sorry, I couldn't process that request. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  // Creates a new editor instance with custom configurations
  const editor = useCreateBlockNote({
    initialContent: initialContent,
    // Customize the editor to remove Command+K shortcut for links
    domAttributes: {
      editor: {
        class: "custom-editor-instance"
      }
    }
  });

  // Function to handle asking AI through chat
  const handleAskAiChat = useCallback(() => {
    if (!editor || !onOpenAiChat) return;
    
    const selectedText = editor.getSelectedText();
    if (!selectedText) {
      alert("Please select some text to ask about");
      return;
    }
    
    // Open the AI chat with the selected text as context
    onOpenAiChat(selectedText);
  }, [editor, onOpenAiChat]);

  // Function to create a task from selected text
  const handleCreateTask = useCallback(() => {
    if (!editor || !onCreateTask) return;
    
    const selectedText = editor.getSelectedText();
    if (!selectedText) {
      alert("Please select some text to create a task");
      return;
    }
    
    // Create a task with the selected text as details
    onCreateTask(selectedText);
  }, [editor, onCreateTask]);

  // Function to summarize text
  const handleSummarize = useCallback(() => {
    if (!editor) return;
    
    const selectedText = editor.getSelectedText();
    if (!selectedText) {
      alert("Please select some text to summarize");
      return;
    }
    
    const promptText = aiCommands.summarize.prompt(selectedText);
    
    handleAiAssist(promptText, (aiResponse) => {
      // Insert summary after selection
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{ type: "paragraph", content: aiResponse }],
        currentBlock,
        "after"
      );
    });
  }, [editor, handleAiAssist]);

  // Renders the editor instance using a React component.
  return (
    <div className="editor-container relative">
      <BlockNoteView 
        editor={editor} 
        editable={!readOnly}
        onChange={() => {
          if (onChange) {
            // Get the editor's content as JSON
            const content = editor.topLevelBlocks;
            onChange(content);
          }
        }}
      />
      {isAiLoading && (
        <div className="absolute top-2 right-2 bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1">
          <Sparkles size={14} className="animate-pulse" />
          <span className="text-xs">AI thinking...</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button 
          onClick={handleAskAiChat}
          disabled={isAiLoading || !onOpenAiChat}
          className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md text-xs"
        >
          <Bot size={12} />
          Ask AI
        </button>
        <button 
          onClick={handleCreateTask}
          disabled={isAiLoading || !onCreateTask}
          className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md text-xs"
        >
          <ListTodo size={12} />
          Create Task
        </button>
        <button 
          onClick={handleSummarize}
          disabled={isAiLoading}
          className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md text-xs"
        >
          <Wand2 size={12} />
          Summarize
        </button>
      </div>
    </div>
  );
} 