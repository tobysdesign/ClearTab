import { useState, useEffect, useCallback } from "react";

export function useKeyboardShortcuts() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showShortcutHelper, setShowShortcutHelper] = useState(false);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const openChatWithPrefix = useCallback((prefix: string) => {
    setIsChatOpen(true);
    // This would need to be handled by the ChatOverlay component
    setTimeout(() => {
      const chatInput = document.querySelector('#chatInput') as HTMLInputElement;
      if (chatInput) {
        chatInput.value = prefix;
        chatInput.focus();
      }
    }, 100);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      // Don't trigger shortcuts when typing in input fields (except for Escape and Ctrl+/)
      if (isInputField && !(e.key === 'Escape' || (isCtrl && e.key === '/'))) {
        return;
      }

      // Ctrl+/ or Cmd+/ to toggle chat
      if (isCtrl && e.key === '/') {
        e.preventDefault();
        if (isChatOpen) {
          closeChat();
        } else {
          openChat();
        }
      }

      // Escape to close chat
      if (e.key === 'Escape') {
        if (isChatOpen) {
          closeChat();
        }
      }

      // Ctrl+N for new note
      if (isCtrl && e.key === 'n' && !isChatOpen) {
        e.preventDefault();
        openChatWithPrefix('#note ');
      }

      // Ctrl+T for new task
      if (isCtrl && e.key === 't' && !isChatOpen) {
        e.preventDefault();
        openChatWithPrefix('#task ');
      }

      // Show shortcut helper on Ctrl key hold
      if (e.key === 'Control' || e.key === 'Meta') {
        setShowShortcutHelper(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setShowShortcutHelper(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isChatOpen, openChat, closeChat, openChatWithPrefix]);

  return {
    isChatOpen,
    openChat,
    closeChat,
    showShortcutHelper,
  };
}
