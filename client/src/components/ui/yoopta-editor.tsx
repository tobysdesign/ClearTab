import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface YooptaEditorComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export interface YooptaEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
}

const YooptaEditorComponent = forwardRef<YooptaEditorRef, YooptaEditorComponentProps>(({ 
  value = "", 
  onChange, 
  placeholder = "Write your content...",
  className = "",
  readOnly = false 
}, ref) => {
  
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getValue: () => localValue,
    setValue: (newValue: string) => setLocalValue(newValue)
  }));

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    // Do not call onChange automatically - only on manual trigger
  };

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`min-h-[200px] resize-y ${className}`}
      readOnly={readOnly}
    />
  );
});

YooptaEditorComponent.displayName = "YooptaEditorComponent";

export default YooptaEditorComponent;

// Utility function to convert rich text to plain text
export function yooptaToPlainText(value: string): string {
  return value || "";
}

// Utility function to convert plain text to rich text format (no-op for now)
export function plainTextToYoopta(text: string): string {
  return text || "";
}