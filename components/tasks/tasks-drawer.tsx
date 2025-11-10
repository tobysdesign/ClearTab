'use client'

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { EditTaskForm } from "@/components/widgets/edit-task-form";
import { CloseIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
        <DrawerContent direction="right" overlayVariant="settings">
          <div className={styles.header}>
            <DrawerTitle className={styles.title}>
              {(activeTask?.id && !activeTask.id.startsWith("draft-")) ||
              (activeTaskId && !activeTaskId.startsWith("draft-"))
                ? "EDIT TASK"
                : "CREATE TASK"}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {(activeTask?.id && !activeTask.id.startsWith("draft-")) ||
              (activeTaskId && !activeTaskId.startsWith("draft-"))
                ? "Edit the selected task details"
                : "Create a new task with title, description, and due date"}
            </DrawerDescription>

            {/* Show actions menu for edit mode, X button for create mode */}
            {(activeTask?.id && !activeTask.id.startsWith("draft-")) ||
            (activeTaskId && !activeTaskId.startsWith("draft-")) ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost-icon" size="icon">
                    ⋮
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteTask}
                    className="stop"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DrawerClose asChild>
                <button className="button" aria-label="Close dialog">
                  <CloseIcon size={20} />
                </button>
              </DrawerClose>
            )}
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