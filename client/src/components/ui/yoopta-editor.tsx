import { useState, useCallback, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";

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
  placeholder = "Write your content...",
  className = "",
  readOnly = false 
}: YooptaEditorComponentProps) {
  
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Update local state immediately for responsive UI
    setLocalValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the onChange callback
    timeoutRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
    }, 500);
  }, [onChange]);

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`min-h-[200px] resize-y ${className}`}
      readOnly={readOnly}
    />
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