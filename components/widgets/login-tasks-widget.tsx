"use client";

import React from "react";
import type { Task } from "@/shared/schema";
import { WidgetHeader, WidgetContainer, WidgetContent } from "@cleartab/ui";

import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateSmart } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ClientOnly } from "@/components/ui/safe-motion";
import { AddButton } from "@/components/ui/add-button";
import tasksStyles from "./tasks-widget.module.css";

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review dashboard design",
    content: {
      ops: [
        {
          insert: "Go through the latest design mockups and provide feedback\n",
        },
      ],
    } as Task["content"],
    isCompleted: false,
    isHighPriority: true,
    dueDate: new Date(Date.now() + 86_400_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "demo",
  },
  {
    id: "2",
    title: "Update project documentation",
    content: {
      ops: [
        {
          insert: "Add recent API changes to the documentation\n",
        },
      ],
    } as Task["content"],
    isCompleted: true,
    isHighPriority: false,
    dueDate: new Date(Date.now() - 86_400_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "demo",
  },
  {
    id: "3",
    title: "Plan next sprint",
    content: {
      ops: [
        {
          insert: "Organize backlog and assign tasks for next sprint\n",
        },
      ],
    } as Task["content"],
    isCompleted: false,
    isHighPriority: false,
    dueDate: new Date(Date.now() + 172_800_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "demo",
  },
];

function TaskItem({ task }: { task: Task }) {
  return (
    <motion.div
      key={task.id}
      layoutId={`card-${task.id}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className={cn("widget-list-item widget-list-item--tasks")}
      style={{ pointerEvents: "none" }}
    >
      <div className={tasksStyles.tasksContent}>
        <div className={tasksStyles.tasksContentLeft}>
          <Checkbox
            id={`task-${task.id}`}
            checked={task.isCompleted}
            onCheckedChange={() => {}}
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
            <span className={tasksStyles.taskPriorityIndicator}>!</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function LoginTasksWidget() {
  return (
    <WidgetContainer>
      <WidgetHeader title="Tasks">
        <AddButton onClick={() => {}} />
      </WidgetHeader>
      <WidgetContent>
        <div className={cn(tasksStyles.tasksContainer, "custom-scrollbar")}>
          <div className="ListContent">
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
                  {mockTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </ClientOnly>
          </div>
        </div>
      </WidgetContent>
    </WidgetContainer>
  );
}