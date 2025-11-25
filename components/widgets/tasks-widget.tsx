"use client";

import { useState, useCallback, useEffect } from "react";
import { AddButton } from "@cleartab/ui";
import type { Task } from "@/shared/schema";
import {
  WidgetHeader,
  WidgetContainer,
  WidgetContent,
  WidgetLoader,
} from "@cleartab/ui";
import { EmptyState } from "@cleartab/ui";
import { useTaskModal } from "@/hooks/use-task-modal";
import { EMPTY_QUILL_CONTENT, type QuillDelta } from "@/shared/schema";
import { Checkbox } from "@cleartab/ui";
import { motion, AnimatePresence } from "framer-motion";
import tasksStyles from "./tasks-widget.module.css";

import { ClientOnly } from "@cleartab/ui";
import { CloseIcon } from "@/components/icons";

import { formatDateSmart } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast as sonnerToast } from "sonner";

interface TasksWidgetProps {
  searchQuery?: string;
}

// API functions (these should now use isCompleted and priority for updates)
async function fetchTasks(): Promise<Task[]> {
  const res = await api.get("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const response = await res.json();
  return response.data || [];
}

async function updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
  console.log("updateTask called with:", task);
  const res = await api.put(`/api/tasks`, task);
  console.log("updateTask response status:", res.status);
  if (!res.ok) {
    const errorBody = await res.json();
    console.error("updateTask error:", errorBody);
    throw new Error("Failed to update task");
  }
  const response = await res.json();
  console.log("updateTask success:", response);
  return response.data;
}

async function deleteTask(taskId: string): Promise<void> {
  const res = await api.delete(`/api/tasks?id=${taskId}`);
  if (!res.ok) throw new Error("Failed to delete task");
}

async function createTask(
  title: string,
  isCompleted: boolean,
  isHighPriority: boolean,
  content: QuillDelta,
): Promise<Task> {
  const res = await api.post("/api/tasks", {
    title,
    isCompleted, // Use passed isCompleted
    isHighPriority, // Use passed high priority flag
    content, // Use passed content
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.error || "Failed to create task");
  }
  const response = await res.json();
  return response.data;
}

// Function to create a task from editor text
export async function createTaskFromText(text: string): Promise<Task | null> {
  try {
    if (!text) return null;

    // Extract title from first line or use truncated text
    const lines = text.split("\n");
    const title =
      lines[0].length > 50 ? lines[0].substring(0, 50) + "..." : lines[0];

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        isCompleted: false, // Default for new tasks from text
        isHighPriority: false, // Default for new tasks from text
        content: EMPTY_QUILL_CONTENT, // Use proper Quill content format
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(errorBody.error || "Failed to create task");
    }

    const response = await res.json();
    return response.data;
  } catch {
    return null;
  }
}

export function TasksWidget({ searchQuery: _searchQuery }: TasksWidgetProps) {
  const {
    setActiveTaskId,
    setNewTaskText,
    activeTask,
    registerTaskUpdateCallback,
    unregisterTaskUpdateCallback,
  } = useTaskModal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Create a stable loadTasks function
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchTasks();
      setTasks(data);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle granular task updates from modal
  const handleTaskUpdate = useCallback(
    (updatedTask: Task, operation: "update" | "create" | "delete") => {
      console.log("TasksWidget: handling task update", {
        updatedTask,
        operation,
      });

      setTasks((prev) => {
        switch (operation) {
          case "update":
            return prev.map((task) =>
              task.id === updatedTask.id ? updatedTask : task,
            );
          case "create":
            // Add new task to the beginning of the list
            return [updatedTask, ...prev];
          case "delete":
            return prev.filter((task) => task.id !== updatedTask.id);
          default:
            return prev;
        }
      });
    },
    [],
  );

  // Register task update callback with modal
  useEffect(() => {
    registerTaskUpdateCallback(handleTaskUpdate);
    return () => {
      unregisterTaskUpdateCallback(handleTaskUpdate);
    };
  }, [
    handleTaskUpdate,
    registerTaskUpdateCallback,
    unregisterTaskUpdateCallback,
  ]);

  const updateTaskLocal = useCallback(
    async (updatedTask: Partial<Task> & { id: string }) => {
      console.log("updateTaskLocal called with:", updatedTask);

      // Store original state for rollback
      const originalTasks = [...tasks];

      try {
        // Optimistically update UI
        setTasks((prev) =>
          prev.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
          ),
        );
        console.log("UI updated optimistically");

        // Update on server
        await updateTask(updatedTask);
        console.log("Server update successful");
      } catch (error) {
        console.error("updateTaskLocal error:", error);
        // Rollback to original state immediately
        setTasks(originalTasks);
        console.log("Rolled back to original state due to error");

        // Show user-friendly error
        alert(
          `Failed to update task: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [tasks],
  );

  const deleteTaskLocal = useCallback(async (taskId: string) => {
    try {
      // Delete from server first (pessimistic delete)
      await deleteTask(taskId);

      // Only remove from UI if server deletion succeeded
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      // Show simple success toast
      sonnerToast.success("Task deleted", {
        duration: 3000,
      });
    } catch (error) {
      // Reload on error to sync with server
      const data = await fetchTasks();
      setTasks(data);

      // Show error toast
      sonnerToast.error("Failed to delete task", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });

      throw error;
    }
  }, []);

  const createTaskLocal = useCallback(
    async (newTaskData: {
      title: string;
      isCompleted: boolean;
      isHighPriority: boolean;
      content: QuillDelta;
    }) => {
      try {
        // Create task on server
        const newTask = await createTask(
          newTaskData.title,
          newTaskData.isCompleted,
          newTaskData.isHighPriority,
          newTaskData.content,
        );

        // Add to local state
        setTasks((prev) => [newTask, ...prev]);

        // Open the new task in the modal
        setActiveTaskId(newTask.id);

        return newTask;
      } catch (error) {
        throw error;
      }
    },
    [setActiveTaskId],
  );

  const handleTaskStatusChange = useCallback(
    (taskId: string, isCompleted: boolean) => {
      updateTaskLocal({ id: taskId, isCompleted });
    },
    [updateTaskLocal],
  );

  function _handleTaskSave(_updatedTask: Partial<Task>) {
    // Removed activeTask check and direct mutation - now handled by EditTaskForm's onSave
    // The EditTaskForm now directly calls updateTask server action
  }

  function _handleTaskDelete(_taskId: string) {
    deleteTaskLocal(_taskId);
  }

  function handleAddTask() {
    console.log("[PERF] handleAddTask clicked at:", Date.now());
    // Open modal immediately without creating task server-side
    // Task will be created on first save in the form
    // Use a space character instead of empty string to trigger drawer opening
    setNewTaskText(" ");
    console.log("[PERF] setNewTaskText called at:", Date.now());
  }

  // Function to handle creating a task from editor text
  function _handleCreateTaskFromEditorText(_text: string) {
    // We now just set the initial text, the modal open and form creation is handled by ClientProviders
    setNewTaskText(_text);
    // Create a basic task to get an ID, then rely on the modal to open it with description
    createTaskLocal({
      title: _text.split("\n")[0] || "New Task",
      isCompleted: false,
      isHighPriority: false,
      content: {
        ops: [{ insert: _text || "" }, { insert: "\n" }],
      },
    });
  }

  // Removed activeTask calculation from here, it's now handled by the context

  if (isLoading) {
    return <WidgetLoader minHeight="280px" />;
  }

  if (isError) {
    return (
      <div className={tasksStyles.tasksError}>
        Failed to load tasks. Please try again later.
      </div>
    );
  }

  return (
    <WidgetContainer className="tasks-widget">
      <WidgetHeader title="Tasks">
        <AddButton onClick={handleAddTask} />
      </WidgetHeader>
      <WidgetContent>
        <div className={cn(tasksStyles.tasksContainer, "custom-scrollbar")}>
          <div className="ListContent">
            <div className={tasksStyles.tasksEmpty}>
              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks!"
                  description="Create a task now?"
                  action={{
                    label: "Add Task",
                    onClick: handleAddTask,
                  }}
                  className={tasksStyles.tasksScrollArea}
                />
              ) : (
                <ClientOnly>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                      },
                    }}
                  >
                    <AnimatePresence>
                      {tasks.map((task) => {
                        const isActive = activeTask?.id === task.id;
                        return (
                          <motion.div
                            key={task.id}
                            layoutId={`card-${task.id}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            onClick={() => {
                              console.log("Setting active task ID:", task.id);
                              console.log("Full task object:", task);
                              setActiveTaskId(task.id);
                            }}
                            className={cn(
                              "widget-list-item widget-list-item--tasks",
                              isActive && "active",
                            )}
                          >
                            {/* Pink dot for active item */}
                            {isActive && (
                              <div
                                className={tasksStyles.taskActiveIndicator}
                              />
                            )}

                            <div className={tasksStyles.tasksContent}>
                              <div className={tasksStyles.tasksContentLeft}>
                                <Checkbox
                                  id={`task-${task.id}`}
                                  checked={task.isCompleted}
                                  onCheckedChange={(checked) =>
                                    handleTaskStatusChange(
                                      task.id,
                                      checked as boolean,
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <h3
                                  className={cn(
                                    tasksStyles.taskTitle,
                                    task.isCompleted
                                      ? tasksStyles.taskTitleCompleted
                                      : tasksStyles.taskTitleIncomplete,
                                  )}
                                >
                                  {task.title}
                                </h3>
                              </div>
                              <div className={tasksStyles.tasksContentRight}>
                                {task.dueDate && (
                                  <span
                                    className={cn(
                                      tasksStyles.taskDueDate,
                                      new Date(task.dueDate) < new Date() &&
                                        tasksStyles.taskDueDateOverdue,
                                    )}
                                  >
                                    {formatDateSmart(task.dueDate)}
                                  </span>
                                )}
                                {task.isHighPriority && (
                                  <span
                                    className={
                                      tasksStyles.taskPriorityIndicator
                                    }
                                  >
                                    !
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                </ClientOnly>
              )}
            </div>
          </div>
        </div>
      </WidgetContent>
    </WidgetContainer>
  );
}
