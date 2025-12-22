'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './select.module.css'

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    onValueChange?: (value: string) => void;
  }
>(({ className, children, onValueChange, value, ...props }, ref) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        className={cn(
          styles.select,
          className
        )}
        ref={ref}
        onChange={onValueChange ? (e) => onValueChange(e.target.value) : props.onChange}
        value={value}
        {...props}
      >
        {children}
      </select>
      <div className={styles.iconContainer}>
        <svg
          className={styles.icon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m6 9 6 6 6-6"
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
>(({ className: _className, children: _children, ..._props }, _ref) => {
  // This component is a placeholder to maintain prop compatibility
  // with the previous Radix-based component. It does not render anything itself.
  // The native <select> handles the trigger.
  return null;
});
SelectTrigger.displayName = 'SelectTrigger'


const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ placeholder: _placeholder, ..._props }, _ref) => {
  // This component is a placeholder to maintain prop compatibility
  // with the previous Radix-based component. The native <select> shows the value.
  // The placeholder is handled by a disabled <option> in the Select component.
  return null;
});
SelectValue.displayName = 'SelectValue'

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ..._props }, _ref) => {
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
>(({ className: _className, children: _children, ...props }, ref) => {
  return (
    <option
      ref={ref}
      className={cn(styles.option, _className)}
      {...props}
    >
      {_children}
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