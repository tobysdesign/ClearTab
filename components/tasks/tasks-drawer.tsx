'use client'

import React from "react";
import { DockPanel, SimpleDropdown, SimpleDropdownItem, Button } from "@cleartab/ui";
import { EditTaskForm } from "@/components/widgets/edit-task-form";
import { useTaskModal } from "@/hooks/use-task-modal";
import styles from "./tasks-drawer.module.css";
import footerStyles from "../ui/modal-actions.module.css";

export function TasksDrawer() {
  const {
    activeTask,
    activeTaskId,
    newTaskText,
    isCreatingNew,
    isLoadingTask,
    handleModalClose,
    handleModalSave,
    handleDeleteTask,
    handleCancelTask,
  } = useTaskModal();

  const isOpen = !!(activeTaskId || newTaskText !== null || isCreatingNew);
  const isEditing = !!(
    (activeTask?.id && !activeTask.id.startsWith("draft-")) ||
    (activeTaskId && !activeTaskId.startsWith("draft-"))
  );

  // Grow the popover from whatever the user clicked (a task row, an add button),
  // so it's contextual to where the task sits. We record the last pressed element
  // and snapshot it when the modal opens (kept stable while open).
  const lastPointerElRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof HTMLElement) lastPointerElRef.current = e.target;
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  // The description editor is a Quill instance that's slow to build. We render the
  // content on first open and DockPanel's keepMounted keeps it warm, so every open
  // after the first is instant. One EditTaskForm (stable key) re-targets each task.
  const [hasOpened, setHasOpened] = React.useState(false);
  const wasOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setAnchorEl(lastPointerElRef.current);
      setHasOpened(true);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Cmd/Ctrl+Enter finishes (the editor uses plain Enter for newlines)
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleModalClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleModalClose]);

  return (
    <DockPanel
      isOpen={isOpen}
      onClose={handleModalClose}
      anchorEl={anchorEl}
      keepMounted
      preferredPlacement="bottom"
      className={styles.taskPopover}
    >
      {hasOpened && (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {isEditing ? "Edit task" : "New task"}
            </h2>
            <div className={styles.headerActions}>
              {/* Edit mode keeps the actions menu (Delete) in the header */}
              {isEditing && (
                <SimpleDropdown
                  trigger={
                    <Button variant="ghost-icon" size="icon" tooltipLabel="More actions" shortcut="⌘/.">
                      ⋮
                    </Button>
                  }
                  align="right"
                >
                  <SimpleDropdownItem onClick={handleDeleteTask}>
                    Delete
                  </SimpleDropdownItem>
                </SimpleDropdown>
              )}
              <Button variant="ghost-icon" onClick={handleModalClose}>
                <span>Close</span>
                <kbd className={styles.escKey}>Esc</kbd>
              </Button>
            </div>
          </div>
          <EditTaskForm
            key="stable-task-form"
            task={activeTask}
            onClose={handleModalClose}
            onSave={handleModalSave}
            onCancel={handleCancelTask}
            initialText={newTaskText || undefined}
            isCreating={isCreatingNew}
            isLoadingTask={isLoadingTask}
          />
          <div className={footerStyles.footer}>
            <Button onClick={handleModalClose}>
              <span>Done</span>
              <kbd className={footerStyles.kbd}>⌘⏎</kbd>
            </Button>
          </div>
        </>
      )}
    </DockPanel>
  );
}
