/**
 * Yoopta Editor Black Theme Configuration
 * Reusable theme styles for consistent black theme across all editor instances
 */

export const yooptaBlackTheme = {
  // Editor container
  '.yoopta-editor': {
    background: 'hsl(0 0% 0%)',
    color: 'hsl(0 0% 100%)',
    border: 'none',
  },
  
  // Selection styles - override blue defaults
  '.yoopta-editor ::selection': {
    background: 'hsl(0 0% 12%)',
    color: 'hsl(0 0% 100%)',
  },
  
  '.yoopta-editor ::-moz-selection': {
    background: 'hsl(0 0% 12%)',
    color: 'hsl(0 0% 100%)',
  },
  
  // Action menu (slash commands)
  '.yoopta-action-menu-list': {
    background: 'hsl(0 0% 5%)',
    border: '1px solid hsl(0 0% 15%)',
    color: 'hsl(0 0% 100%)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  
  '.yoopta-action-menu-list-item': {
    color: 'hsl(0 0% 100%)',
    background: 'transparent',
  },
  
  '.yoopta-action-menu-list-item:hover': {
    background: 'hsl(0 0% 12%)',
    color: 'hsl(0 0% 100%)',
  },
  
  // Toolbar
  '.yoopta-toolbar': {
    background: 'hsl(0 0% 5%)',
    border: '1px solid hsl(0 0% 15%)',
    color: 'hsl(0 0% 100%)',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  
  '.yoopta-toolbar button': {
    color: 'hsl(0 0% 65%)',
    background: 'transparent',
    border: 'none',
  },
  
  '.yoopta-toolbar button:hover': {
    background: 'hsl(0 0% 12%)',
    color: 'hsl(0 0% 100%)',
  },
  
  // Placeholder text
  '.yoopta-placeholder': {
    color: 'hsl(0 0% 50%)',
  },
  
  // Block elements
  '.yoopta-block': {
    color: 'hsl(0 0% 100%)',
  },
  
  // Headings
  '.yoopta-heading-one': {
    color: 'hsl(0 0% 100%)',
  },
  
  '.yoopta-heading-two': {
    color: 'hsl(0 0% 100%)',
  },
  
  '.yoopta-heading-three': {
    color: 'hsl(0 0% 100%)',
  },
  
  // Paragraph
  '.yoopta-paragraph': {
    color: 'hsl(0 0% 100%)',
  },
  
  // Lists
  '.yoopta-list': {
    color: 'hsl(0 0% 100%)',
  },
  
  // Blockquote
  '.yoopta-blockquote': {
    color: 'hsl(0 0% 100%)',
    borderLeft: '4px solid hsl(0 0% 25%)',
    background: 'hsl(0 0% 3%)',
  },
  
  // Code blocks
  '.yoopta-code': {
    background: 'hsl(0 0% 8%)',
    color: 'hsl(0 0% 100%)',
    border: '1px solid hsl(0 0% 15%)',
  },
  
  // Links
  '.yoopta-link': {
    color: 'hsl(0 0% 85%)',
    textDecoration: 'underline',
  },
  
  '.yoopta-link:hover': {
    color: 'hsl(0 0% 100%)',
  },
  
  // Override any remaining blue/light backgrounds
  '.yoopta-editor [style*="#c6ddf8"]': {
    background: 'hsl(0 0% 12%) !important',
    color: 'hsl(0 0% 100%) !important',
  },
  
  '.yoopta-editor [style*="background-color: white"]': {
    backgroundColor: 'hsl(0 0% 5%) !important',
  },
  
  '.yoopta-editor [style*="color: black"]': {
    color: 'hsl(0 0% 100%) !important',
  },
};

export default yooptaBlackTheme;