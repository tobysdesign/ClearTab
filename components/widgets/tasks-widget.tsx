"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { CloseIcon, LabelImportantIcon } from "@/components/icons";

import { formatDateSmart } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast as sonnerToast } from "sonner";
import { apiFetch } from "@/lib/api-fetch";

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

    const res = await apiFetch("/api/tasks", {
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

function getInitialCachedTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const cachedRaw = window.localStorage.getItem("cleartab_cached_tasks_v1");
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function TasksWidget({ searchQuery: _searchQuery }: TasksWidgetProps) {
  const {
    setActiveTaskId,
    setNewTaskText,
    activeTask,
    registerTaskUpdateCallback,
    unregisterTaskUpdateCallback,
  } = useTaskModal();
  const [tasks, setTasks] = useState<Task[]>(getInitialCachedTasks);
  const initialHadTasks = useRef(tasks.length > 0);
  const [isLoading, setIsLoading] = useState(!initialHadTasks.current);
  const [isError, setIsError] = useState(false);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<Set<string>>(new Set());
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [isWidgetHighlighted, setIsWidgetHighlighted] = useState(false);
  const hasLoadedOnceRef = useRef(initialHadTasks.current);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const triggerTasksHighlight = useCallback((createdIds?: string[], count?: number) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    if (createdIds && createdIds.length > 0) {
      setHighlightedTaskIds(new Set(createdIds));
    }
    const total = count ?? createdIds?.length ?? 0;
    if (total > 0) {
      setAddedNotice(`+${total} added`);
    }
    setIsWidgetHighlighted(false);
    requestAnimationFrame(() => {
      setIsWidgetHighlighted(true);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    });
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedTaskIds(new Set());
      setAddedNotice(null);
      setIsWidgetHighlighted(false);
    }, 7500);
  }, []);

  // Create a stable loadTasks function (silent once loaded so new tasks animate in smoothly)
  const loadTasks = useCallback(async () => {
    try {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      }
      let data: Task[];
      try {
        data = await fetchTasks();
      } catch {
        // Retry once after a short delay on transient network / DB timeout
        await new Promise((resolve) => setTimeout(resolve, 900));
        data = await fetchTasks();
      }
      setTasks(data);
      hasLoadedOnceRef.current = true;
      setIsError(false);
      try {
        window.localStorage.setItem("cleartab_cached_tasks_v1", JSON.stringify(data));
      } catch {
        // Ignore storage errors
      }
    } catch {
      try {
        const cachedRaw = window.localStorage.getItem("cleartab_cached_tasks_v1");
        if (cachedRaw) {
          const cachedTasks = JSON.parse(cachedRaw);
          if (Array.isArray(cachedTasks)) {
            setTasks(cachedTasks);
            hasLoadedOnceRef.current = true;
            setIsError(false);
            return;
          }
        }
      } catch {
        // Ignore cache read errors
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Listen for delete-all events from settings
  useEffect(() => {
    const handleDeleteAll = (event: Event) => {
      const detail = (event as CustomEvent<{ domain: 'tasks' | 'notes' | 'voice' }>).detail;
      if (detail?.domain === 'tasks') {
        console.log('📣 TasksWidget: Received delete-all event, refreshing...');
        loadTasks();
      }
    };

    window.addEventListener('data-deleted-all', handleDeleteAll as EventListener);
    return () => window.removeEventListener('data-deleted-all', handleDeleteAll as EventListener);
  }, [loadTasks]);

  // Tasks created elsewhere (the AI chat, a note's "+ Task") reload the list and highlight
  useEffect(() => {
    const handleTasksChanged = (event: Event) => {
      const detail = (
        event as CustomEvent<{ createdIds?: string[]; count?: number }>
      ).detail;
      void loadTasks();
      triggerTasksHighlight(detail?.createdIds, detail?.count);
    };

    const handleTasksFocus = () => {
      triggerTasksHighlight();
    };

    window.addEventListener('tasks-changed', handleTasksChanged as EventListener);
    window.addEventListener('tasks-focus', handleTasksFocus as EventListener);
    return () => {
      window.removeEventListener('tasks-changed', handleTasksChanged as EventListener);
      window.removeEventListener('tasks-focus', handleTasksFocus as EventListener);
    };
  }, [loadTasks, triggerTasksHighlight]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

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
    console.log('📝 TaskWidget: Registering task update callback');
    registerTaskUpdateCallback(handleTaskUpdate);
    return () => {
      console.log('🗑️ TaskWidget: Unregistering task update callback');
      unregisterTaskUpdateCallback(handleTaskUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return (
      <WidgetContainer className="tasks-widget">
        <WidgetLoader />
      </WidgetContainer>
    );
  }

  if (isError) {
    return (
      <WidgetContainer className="tasks-widget">
        <WidgetHeader title="Tasks">
          <AddButton onClick={handleAddTask} tooltip="Add task" />
        </WidgetHeader>
        <WidgetContent scrollable={false}>
          <EmptyState
            title="Couldn't load tasks"
            description="Couldn't reach your tasks right now."
            action={{
              label: "Try again",
              onClick: () => {
                void loadTasks();
              },
            }}
          />
        </WidgetContent>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      className={cn("tasks-widget", isWidgetHighlighted && tasksStyles.widgetHighlighted)}
    >
      <WidgetHeader title="Tasks">
        {addedNotice && (
          <span className={tasksStyles.arrivalBadge} role="status">
            ✓ {addedNotice}
          </span>
        )}
        <AddButton onClick={handleAddTask} tooltip="Add task" />
      </WidgetHeader>
      <WidgetContent>
        <div ref={scrollContainerRef} className={tasksStyles.tasksContainer}>
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
                        const isNewlyAdded = highlightedTaskIds.has(task.id);
                        return (
                          <motion.div
                            key={task.id}
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
                              isNewlyAdded && tasksStyles.taskItemHighlighted,
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
                                {isNewlyAdded && (
                                  <span className={tasksStyles.newTaskBadge}>
                                    New
                                  </span>
                                )}
                                {task.isHighPriority && (
                                  <LabelImportantIcon
                                    size={16}
                                    className={tasksStyles.taskPriorityIndicator}
                                  />
                                )}
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
