// Lightweight Framer Motion stub for Chrome extension builds
// Provides basic functionality without heavy animation features

import React from 'react';

// Simple motion components that render as regular divs
export const motion = {
  div: ({ children, className, style, onClick, ...props }) =>
    React.createElement('div', { className, style, onClick, ...props }, children),
  button: ({ children, className, style, onClick, ...props }) =>
    React.createElement('button', { className, style, onClick, ...props }, children),
  span: ({ children, className, style, ...props }) =>
    React.createElement('span', { className, style, ...props }, children),
  p: ({ children, className, style, ...props }) =>
    React.createElement('p', { className, style, ...props }, children),
};

// Stub hooks
export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});

export const useInView = () => [false, () => {}];

export const AnimatePresence = ({ children }) => children;

// Export everything else as pass-through
export * from 'framer-motion';
