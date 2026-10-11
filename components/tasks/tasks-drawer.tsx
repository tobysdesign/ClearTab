'use client'

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { EditTaskForm } from "@/components/widgets/edit-task-form";
import { SimpleDropdown, SimpleDropdownItem } from "@cleartab/ui";
import { Button } from "@cleartab/ui";
import { useTaskModal } from "@/hooks/use-task-modal";
import styles from "./tasks-drawer.module.css";

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

  return (
    <div className={styles.drawerContainer}>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose();
          }
        }}
      >
        <DrawerContent direction="right" overlayVariant="settings" className={styles.panel}>
          <div className={styles.header}>
            <DrawerTitle className={styles.title}>
              {isEditing ? "Edit task" : "New task"}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {isEditing
                ? "Edit the selected task details"
                : "Create a new task with title, description, and due date"}
            </DrawerDescription>

            <div className={styles.headerActions}>
              {/* Actions menu for edit mode, Cancel (discards draft) for create mode */}
              {isEditing ? (
                <SimpleDropdown
                  trigger={
                    <Button variant="ghost" size="icon" tooltipLabel="More actions" shortcut="⌘/.">
                      ⋮
                    </Button>
                  }
                  align="right"
                >
                  <SimpleDropdownItem onClick={handleDeleteTask}>
                    Delete
                  </SimpleDropdownItem>
                </SimpleDropdown>
              ) : (
                <Button variant="ghost" onClick={handleCancelTask}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleModalClose}>
                <span>Done</span>
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
        </DrawerContent>
      </Drawer>
    </div>
  );
}
