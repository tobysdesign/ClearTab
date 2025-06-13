/**
 * Yoopta Editor Black Theme Configuration
 * Reusable theme styles for consistent black theme across all editor instances
 */

export const yooptaBlackTheme = {
  // Editor container - completely transparent
  '.yoopta-editor': {
    background: 'transparent',
    color: 'inherit',
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
  
  // Action menu - transparent
  '.yoopta-action-menu-list': {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
  },
  
  // Toolbar - transparent
  '.yoopta-toolbar': {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
  },
  
  // All elements inherit color
  '.yoopta-editor *': {
    color: 'inherit',
    background: 'transparent',
  },
  
  // Override any hardcoded blue backgrounds
  '.yoopta-editor [style*="#c6ddf8"]': {
    background: 'hsl(0 0% 12%) !important',
    color: 'hsl(0 0% 100%) !important',
  },
};

export default yooptaBlackTheme;