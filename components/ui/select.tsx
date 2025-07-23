'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Select = React.forwardRef<
  HTMLSelectElement,
  React.HTMLAttributes<HTMLSelectElement> & {
    onValueChange?: (value: string) => void;
    value?: string; // Explicitly add value prop
  }
>(({ className, children, onValueChange, value, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={onValueChange ? (e) => onValueChange(e.target.value) : props.onChange} // Map onValueChange to onChange
        value={value} // Use the explicitly destructured value
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          ></path>
        </svg>
      </div>
    </div>
  )
})
Select.displayName = 'Select'

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    // This component is a placeholder to maintain prop compatibility
    // with the previous Radix-based component. It does not render anything itself.
    // The native <select> handles the trigger.
    return null;
});
SelectTrigger.displayName = 'SelectTrigger'


const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ placeholder, ...props }, ref) => {
    // This component is a placeholder to maintain prop compatibility
    // with the previous Radix-based component. The native <select> shows the value.
    // The placeholder is handled by a disabled <option> in the Select component.
    return null;
});
SelectValue.displayName = 'SelectValue'

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
    // This is not a direct wrapper anymore. The children (SelectItems) will be direct children of the native select.
    // This component is being maintained for API compatibility.
  return <>{children}</>
})
SelectContent.displayName = 'SelectContent'

const SelectGroup = React.forwardRef<
  HTMLOptGroupElement,
  React.HTMLAttributes<HTMLOptGroupElement> & { children: React.ReactNode, label?: string }
>(({ children, label, ...props }, ref) => {
    return <optgroup ref={ref} label={label} {...props}>{children}</optgroup>
});
SelectGroup.displayName = 'SelectGroup'


const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => {
  return (
    <option
      ref={ref}
      className={cn('bg-background text-foreground', className)}
      {...props}
    >
      {children}
    </option>
  )
})
SelectItem.displayName = 'Select'

const SelectLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...props}
  />
))
SelectLabel.displayName = 'SelectLabel'


export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} 