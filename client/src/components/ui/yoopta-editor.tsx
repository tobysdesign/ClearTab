import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Quote, Code, Link2 } from "lucide-react";
import { useEffect, useState, useRef } from 'react';

interface YooptaEditorComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function YooptaEditorComponent({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  readOnly = false 
}: YooptaEditorComponentProps) {
  const [content, setContent] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setContent(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const insertText = (before: string, after: string = "") => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    handleChange(newText);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertListItem = (type: 'ul' | 'ol') => {
    const prefix = type === 'ul' ? '• ' : '1. ';
    const lines = content.split('\n');
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const currentLine = lines.find((_, index) => {
      const lineEnd = content.indexOf('\n', lineStart);
      return start >= lineStart && start <= (lineEnd === -1 ? content.length : lineEnd);
    }) || '';
    
    if (!currentLine.startsWith(prefix)) {
      insertText('\n' + prefix);
    }
  };

  if (readOnly) {
    return (
      <div className={`p-3 border rounded-md bg-muted/30 text-sm whitespace-pre-wrap ${className}`}>
        {content || placeholder}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('**', '**')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('*', '*')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('`', '`')}
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertListItem('ul')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertListItem('ol')}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('\n> ')}
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('[', '](url)')}
          className="h-8 w-8 p-0"
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Editor */}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] resize-none font-mono text-sm"
        rows={8}
      />

      {/* Preview */}
      {content && (
        <div className="p-3 border rounded-md bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground mb-2">Preview:</div>
          <div className="text-sm space-y-2">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-lg font-bold">{line.substring(2)}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-base font-semibold">{line.substring(3)}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={index} className="text-sm font-medium">{line.substring(4)}</h3>;
              }
              if (line.startsWith('> ')) {
                return <blockquote key={index} className="border-l-4 border-border pl-3 italic text-muted-foreground">{line.substring(2)}</blockquote>;
              }
              if (line.startsWith('• ') || line.match(/^\d+\. /)) {
                return <li key={index} className="ml-4">{line.replace(/^[•\d+\.]\s/, '')}</li>;
              }
              if (line.trim() === '') {
                return <br key={index} />;
              }
              
              // Process inline formatting
              let processedLine = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary underline">$1</a>');
              
              return <p key={index} dangerouslySetInnerHTML={{ __html: processedLine }} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to convert rich text to plain text
export function yooptaToPlainText(value: string): string {
  return value || "";
}

// Utility function to convert plain text to rich text format (no-op for now)
export function plainTextToYoopta(text: string): string {
  return text || "";
}