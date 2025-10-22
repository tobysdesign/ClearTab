'use client'

import React from 'react'
import type { Task } from '@/shared/schema'
import { WidgetHeader } from '@/components/ui/widget-header'
import { WidgetContainer, WidgetContent } from '@/components/ui/widget-container'
import { Checkbox } from '@/components/ui/checkbox'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDateSmart } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { ClientOnly } from '@/components/ui/safe-motion'
import { AddButton } from '@/components/ui/add-button'
import tasksStyles from './tasks-widget.module.css'

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review dashboard design',
    content: {
      ops: [
        { insert: 'Go through the latest design mockups and provide feedback\n' }
      ]
    },
    isCompleted: false,
    isHighPriority: true,
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'demo'
  },
  {
    id: '2',
    title: 'Team standup preparation',
    content: {
      ops: [
        { insert: 'Prepare talking points for tomorrow\'s standup meeting\n' }
      ]
    },
    isCompleted: false,
    isHighPriority: false,
    dueDate: new Date(Date.now() + 43200000).toISOString(), // 12 hours
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    userId: 'demo'
  },
  {
    id: '3',
    title: 'Update project documentation',
    content: {
      ops: [
        { insert: 'Review and update the project README and API documentation\n' }
      ]
    },
    isCompleted: true,
    isHighPriority: false,
    dueDate: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    userId: 'demo'
  },
  {
    id: '4',
    title: 'Plan Q4 objectives',
    content: {
      ops: [
        { insert: 'Define key objectives and key results for Q4\n' }
      ]
    },
    isCompleted: false,
    isHighPriority: false,
    dueDate: new Date(Date.now() + 604800000).toISOString(), // 1 week
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    userId: 'demo'
  }
]

export function LoginTasksWidget() {
  return (
    <WidgetContainer>
      <WidgetHeader title="Tasks">
        <AddButton onClick={() => {}} />
      </WidgetHeader>
      <WidgetContent>
        <div className={cn(tasksStyles.tasksContainer, "custom-scrollbar")}>
          <div className={tasksStyles.tasksListContent}>
            <div className={tasksStyles.tasksEmpty}>
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
                      <motion.div
                        key={task.id}
                        layoutId={`card-${task.id}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        className={cn(
                          "widget-list-item widget-list-item--tasks",
                        )}
                        style={{ pointerEvents: 'none' }}
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
                                  new Date(task.dueDate) < new Date() && tasksStyles.taskDueDateOverdue
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
                    ))}
                  </AnimatePresence>
                </motion.div>
              </ClientOnly>
            </div>
          </div>
        </div>
      </WidgetContent>
    </WidgetContainer>
  )
}