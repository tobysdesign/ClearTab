"use client";

import { useState, useCallback } from "react";
import { AddButton } from "@/components/ui/add-button";
import type { Task } from "@/shared/schema";
import { WidgetHeader } from "@/components/ui/widget-header";
import {
  WidgetContainer,
  WidgetContent,
} from "@/components/ui/widget-container";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetLoader } from "@/components/widgets/widget-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { useTaskModal } from "../providers/ExtensionProvidersWrapper";
import { EMPTY_BLOCKNOTE_CONTENT, type BlockNoteContent } from "@/shared/schema";
import tasksStyles from "@/components/widgets/tasks-widget.module.css";

import { ClientOnly } from "@/components/ui/safe-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useExtensionStorage } from "../hooks/use-extension-storage";

interface TasksWidgetProps {
  searchQuery?: string;
}

export function ExtensionTasksWidget({ searchQuery: _searchQuery }: TasksWidgetProps) {
  const { setActiveTaskId, setNewTaskText, activeTask } = useTaskModal();
  const { data: tasks, setData: setTasks, loading: isLoading } = useExtensionStorage<Task[]>('tasks', []);
  const [isError, setIsError] = useState(false);

  const updateTaskLocal = useCallback(
    async (updatedTask: Partial<Task> & { id: string }) => {
      try {
        // Update task in Chrome Storage
        const updatedTasks = tasks.map((task) =>
          task.id === updatedTask.id ? { ...task, ...updatedTask, updatedAt: new Date().toISOString() } : task
        );
        setTasks(updatedTasks);
      } catch (error) {
        setIsError(true);
        throw error;
      }
    },
    [tasks, setTasks],
  );

  const deleteTaskLocal = useCallback(async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);
    } catch (error) {
      setIsError(true);
      throw error;
    }
  }, [tasks, setTasks]);

  const createTaskLocal = useCallback(
    async (newTaskData: {
      title: string;
      isCompleted: boolean;
      isHighPriority: boolean;
      content: BlockNoteContent;
    }) => {
      try {
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: newTaskData.title,
          content: newTaskData.content,
          isCompleted: newTaskData.isCompleted,
          isHighPriority: newTaskData.isHighPriority,
          dueDate: null,
          userId: 'extension-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);

        // Open the new task in the modal
        setActiveTaskId(newTask.id);

        return newTask;
      } catch (error) {
        setIsError(true);
        throw error;
      }
    },
    [tasks, setTasks, setActiveTaskId],
  );

  const handleTaskStatusChange = useCallback(
    (taskId: string, isCompleted: boolean) => {
      updateTaskLocal({ id: taskId, isCompleted });
    },
    [updateTaskLocal],
  );

  function handleAddTask() {
    createTaskLocal({
      title: "New Task",
      isCompleted: false,
      isHighPriority: false,
      content: EMPTY_BLOCKNOTE_CONTENT,
    });
  }

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