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
import { useWidgetHeight } from "@/hooks/use-widget-height";
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

/**
 * Read a task API response safely. The endpoint should always return JSON, but a
 * dropped/stale session or a server error can return an HTML page (login redirect,
 * error overlay). Blindly calling res.json() on that throws the cryptic
 * "Unexpected token '<'" — so parse the text ourselves and raise a clear, actionable
 * error that names the status (and a snippet) instead.
 */
async function readTaskJson(res: Response, action: string): Promise<any> {
  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      const snippet = text.slice(0, 80).replace(/\s+/g, " ").trim();
      const looksHtml = /^<(!doctype|html)/i.test(text.trim());
      throw new Error(
        `${action} failed: the server returned ${res.status} with a non-JSON response` +
          (looksHtml ? " (an HTML page — you may be signed out; try reloading)" : "") +
          (snippet ? ` — "${snippet}…"` : ""),
      );
    }
  }
  if (!res.ok) {
    throw new Error(body?.error || `${action} failed (${res.status})`);
  }
  return body;
}

async function fetchTasks(): Promise<Task[]> {
  const res = await api.get("/api/tasks");
  const response = await readTaskJson(res, "Loading tasks");
  return response?.data || [];
}

async function updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
  const res = await api.put(`/api/tasks`, task);
  const response = await readTaskJson(res, "Updating task");
  return response.data;
}

async function deleteTask(taskId: string): Promise<void> {
  const res = await api.delete(`/api/tasks?id=${taskId}`);
  if (!res.ok) await readTaskJson(res, "Deleting task");
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
  const response = await readTaskJson(res, "Creating task");
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
  const { ref, isMini } = useWidgetHeight();
  const [tasks, setTasks] = useState<Task[]>(getInitialCachedTasks);
  const [activeTab, setActiveTab] = useState<"todo" | "complete">("todo");
  // Tasks that were just checked/unchecked: held in the current tab for a beat so the
  // check + strike-through play before the card animates out to the other tab.
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const completeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
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
      // Hold the row in place while it scales down (~0.45s) and pauses (~1s) — the
      // checkbox fills and the title strikes through, giving time to undo an
      // accidental tap — then release it so the exit drops it to the other tab.
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
      const existing = completeTimersRef.current.get(taskId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        completeTimersRef.current.delete(taskId);
      }, 1450);
      completeTimersRef.current.set(taskId, timer);

      updateTaskLocal({ id: taskId, isCompleted });
    },
    [updateTaskLocal],
  );

  // Clear any pending completion-hold timers on unmount
  useEffect(() => {
    const timers = completeTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

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

  // Mini view (short widgets): the next open task + how many more are waiting
  const openTasks = tasks.filter((task) => !task.isCompleted);
  const nextTask = openTasks[0];

  // Tasks shown in the current tab: Todo = open, Complete = done.
  // Checking a task flips isCompleted, so it moves between the two tabs on its own.
  // A just-toggled task is held in place (completingIds) until its exit animation runs.
  const visibleTasks = tasks.filter((task) => {
    const matchesTab = activeTab === "todo" ? !task.isCompleted : task.isCompleted;
    return matchesTab || completingIds.has(task.id);
  });

  if (isLoading) {
    return (
      <div ref={ref} className={tasksStyles.modeWrapper}>
        <WidgetContainer className="tasks-widget">
          <WidgetLoader />
        </WidgetContainer>
      </div>
    );
  }

  if (isError) {
    return (
      <div ref={ref} className={tasksStyles.modeWrapper}>
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
      </div>
    );
  }

  if (isMini) {
    return (
      <div ref={ref} className={tasksStyles.modeWrapper}>
        <WidgetContainer className="tasks-widget">
          <div className={tasksStyles.tasksMiniContainer}>
            {nextTask ? (
              <span
                className={tasksStyles.tasksMiniTitle}
                onClick={() => setActiveTaskId(nextTask.id)}
              >
                {nextTask.title || "Untitled Task"}
              </span>
            ) : (
              <span className={tasksStyles.tasksMiniEmpty}>No tasks</span>
            )}
            <AddButton onClick={handleAddTask} tooltip="Add task" />
          </div>
        </WidgetContainer>
      </div>
    );
  }

  return (
    <div ref={ref} className={tasksStyles.modeWrapper}>
    <WidgetContainer
      className={cn("tasks-widget", isWidgetHighlighted && tasksStyles.widgetHighlighted)}
    >
      {/* Header: title + tabs sit on one row when they fit; the tabs wrap to a
          second line when the widget is too narrow. Add button stays on the right. */}
      <div className={cn("widget-header", tasksStyles.header)}>
        <div className={tasksStyles.headerLeft}>
          <h2 className="widget-title">Tasks</h2>
          {/* Rendered from a list so future label-driven tabs can slot in. */}
          <div className={tasksStyles.tabBar} role="tablist" aria-label="Task filter">
            {([
              { id: "todo", label: "Todo" },
              { id: "complete", label: "Complete" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn(
                  tasksStyles.tab,
                  activeTab === tab.id && tasksStyles.tabActive,
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className={tasksStyles.headerRight}>
          {addedNotice && (
            <span className={tasksStyles.arrivalBadge} role="status">
              ✓ {addedNotice}
            </span>
          )}
          <AddButton onClick={handleAddTask} tooltip="Add task" />
        </div>
      </div>
      <WidgetContent>
        <div ref={scrollContainerRef} className={tasksStyles.tasksContainer}>
          <div className="ListContent">
            <div className={tasksStyles.tasksEmpty}>
              {visibleTasks.length === 0 ? (
                activeTab === "todo" ? (
                  tasks.length === 0 ? (
                    // Never had any tasks — plain empty state
                    <EmptyState
                      title="No tasks!"
                      description="Add a task now?"
                      action={{
                        label: "Add Task",
                        onClick: handleAddTask,
                      }}
                      className={tasksStyles.tasksScrollArea}
                    />
                  ) : (
                    // Emptied: had tasks and cleared them all — celebrate
                    <EmptyState
                      title="Congrats on completing all your tasks!"
                      description="You're all caught up."
                      action={{
                        label: "Add Task",
                        onClick: handleAddTask,
                      }}
                      className={tasksStyles.tasksScrollArea}
                    />
                  )
                ) : (
                  <EmptyState
                    title="Nothing completed yet"
                    description="Completed tasks will show up here."
                    className={tasksStyles.tasksScrollArea}
                  />
                )
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
                    <AnimatePresence mode="popLayout">
                      {visibleTasks.map((task) => {
                        const isActive = activeTask?.id === task.id;
                        const isNewlyAdded = highlightedTaskIds.has(task.id);
                        // Just-toggled rows are held, scaled down in place (see the
                        // completion grace window below), then dropped on exit.
                        const isCompleting = completingIds.has(task.id);
                        return (
                          <motion.div
                            key={task.id}
                            // Position-only layout: when a row drops out, the rows
                            // below slide up to fill the gap (scale won't distort it).
                            layout="position"
                            initial={{ y: 20, opacity: 0, scale: 1 }}
                            // On complete: scale down straight away (ease-out, so it
                            // decelerates into the hold), then the exit drops it.
                            animate={{
                              y: 0,
                              opacity: 1,
                              zIndex: 1,
                              scale: isCompleting ? 0.9 : 1,
                            }}
                            // Exit: after the ~1s pause, drop downward behind the other
                            // rows (lower z-index) toward the bottom, with a little spring.
                            exit={{
                              scale: 0.9,
                              y: 160,
                              opacity: 0,
                              zIndex: 0,
                              transition: { type: "spring", stiffness: 420, damping: 30 },
                            }}
                            whileHover={isCompleting ? undefined : { x: 2 }}
                            transition={{
                              duration: 0.2,
                              ease: "easeOut",
                              // Pronounced fast-start-then-slow (easeOutExpo-ish) so the
                              // deceleration into the paused state is clearly visible.
                              scale: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                            }}
                            onClick={() => {
                              console.log("Setting active task ID:", task.id);
                              console.log("Full task object:", task);
                              setActiveTaskId(task.id);
                            }}
                            className={cn(
                              "widget-list-item widget-list-item--tasks",
                              tasksStyles.taskRow,
                              isActive && tasksStyles.taskActive,
                              isNewlyAdded && tasksStyles.taskItemHighlighted,
                            )}
                          >
                            <div className={tasksStyles.tasksContent}>
                              <div className={tasksStyles.tasksContentLeft}>
                                <label
                                  htmlFor={`task-${task.id}`}
                                  className={tasksStyles.checkboxHit}
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                </label>
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
    </div>
  );
}
