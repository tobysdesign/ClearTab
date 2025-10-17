"use client";

import { useState, useCallback, useEffect } from "react";
import { AddButton } from "@/components/ui/add-button";
import type { Task } from "@/shared/schema";
import { WidgetHeader } from "@/components/ui/widget-header";
import {
  WidgetContainer,
  WidgetContent,
} from "@/components/ui/widget-container";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetLoader } from "./widget-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { useTaskModal } from "@/app/client-providers";
import { EMPTY_BLOCKNOTE_CONTENT, type BlockNoteContent } from "@/shared/schema"; // Corrected import path
import tasksStyles from "./tasks-widget.module.css";

import { ClientOnly } from "@/components/ui/safe-motion";
// Icons replaced with ASCII placeholders
import { format } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

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
  const res = await api.patch(`/api/tasks/${task.id}`, task);
  if (!res.ok) throw new Error("Failed to update task");
  const response = await res.json();
  return response.data;
}

async function deleteTask(taskId: string): Promise<void> {
  const res = await api.delete(`/api/tasks/${taskId}`);
  if (!res.ok) throw new Error("Failed to delete task");
}

async function createTask(
  title: string,
  isCompleted: boolean,
  isHighPriority: boolean,
  content: BlockNoteContent,
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
        priority: "none", // Default for new tasks from text
        // We'll handle the description formatting in the edit form
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
  const { setActiveTaskId, setNewTaskText, activeTask } = useTaskModal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
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
    };
    loadTasks();
  }, []);

  const updateTaskLocal = useCallback(
    async (updatedTask: Partial<Task> & { id: string }) => {
      try {
        // Optimistically update UI
        setTasks((prev) =>
          prev.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
          ),
        );

        // Update on server
        await updateTask(updatedTask);
      } catch (error) {
        // Rollback on error and reload
        const data = await fetchTasks();
        setTasks(data);
        throw error;
      }
    },
    [],
  );

  const deleteTaskLocal = useCallback(async (taskId: string) => {
    try {
      // Optimistically update UI
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      // Delete from server
      await deleteTask(taskId);
    } catch (error) {
      // Rollback on error and reload
      const data = await fetchTasks();
      setTasks(data);
      throw error;
    }
  }, []);

  const createTaskLocal = useCallback(
    async (newTaskData: {
      title: string;
      isCompleted: boolean;
      isHighPriority: boolean;
      content: BlockNoteContent;
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
    createTaskLocal({
      title: "New Task",
      isCompleted: false,
      isHighPriority: false,
      content: EMPTY_BLOCKNOTE_CONTENT, // Use BlockNote's empty content structure
    });
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
        "paragraph-1": {
          id: "paragraph-1",
          type: "paragraph",
          value: [
            {
              id: "paragraph-1-element",
              type: "paragraph",
              children: [{ text: text || "" }], // Use the full text as content
              props: {
                nodeType: "block",
              },
            },
          ],
          meta: {
            order: 0,
            depth: 0,
          },
        },
      },
    });
  }

  // Removed activeTask calculation from here, it's now handled by the context

  if (isLoading) {
    return <WidgetLoader minHeight="h-[280px]" />;
  }

  if (isError) {
    return (
      <div className={tasksStyles.tasksError}>
        Failed to load tasks. Please try again later.
      </div>
    );
  }

  return (
    <WidgetContainer>
      <WidgetHeader title="Tasks">
        <AddButton onClick={handleAddTask} />
      </WidgetHeader>
      <WidgetContent>
        <div className={cn(tasksStyles.tasksContainer, "custom-scrollbar")}>
          <div className={tasksStyles.tasksListContent}>
            <div className={tasksStyles.tasksEmpty}>
              {tasks.length === 0 ? (
                <EmptyState
                  renderIcon={() => (
                    <span className={tasksStyles.tasksEmptyIcon}>×</span>
                  )}
                  title="Not a care"
                  description="Could your first task be to add a task?"
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
                            onClick={() => setActiveTaskId(task.id)}
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
                                  <span className={tasksStyles.taskDueDate}>
                                    {format(new Date(task.dueDate), "d MMM")}
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
