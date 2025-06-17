"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type { Task } from '@/shared/schema'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExpandableCardProps {
  tasks: Task[]
  onTaskCompletionChange: (taskId: number, completed: boolean) => void
}

export function ExpandableCard({ tasks, onTaskCompletionChange }: ExpandableCardProps) {
  const [active, setActive] = useState<Task | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-background border border-border rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-card border border-border sm:rounded-3xl overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start p-6">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      id={`modal-checkbox-${active.id}`}
                      checked={active.completed}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          onTaskCompletionChange(active.id, checked)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <motion.h3
                        layoutId={`title-${active.id}-${id}`}
                        className="font-bold text-foreground"
                      >
                        {active.title}
                        {active.isImportant && <span className="ml-2 h-2 w-2 rounded-full bg-brand-pink inline-block" />}
                      </motion.h3>
                      <motion.p
                        layoutId={`description-${active.id}-${id}`}
                        className="text-muted-foreground"
                      >
                        {active.description}
                      </motion.p>
                    </div>
                  </div>
                  {active.dueDate && (
                    <motion.div
                      layoutId={`due-date-${active.id}-${id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Due: {new Date(active.dueDate).toLocaleDateString()}
                    </motion.div>
                  )}
                </div>
                <div className="pt-4 relative px-6 pb-6">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-40 md:h-fit overflow-auto"
                  >
                    <EditTaskForm task={active} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="w-full space-y-2 h-full overflow-y-auto">
        {tasks.map((task) => (
          <motion.div
            layoutId={`card-${task.id}-${id}`}
            key={`card-${task.id}-${id}`}
            onClick={() => setActive(task)}
            className="p-4 flex flex-col justify-between items-start hover:bg-accent/50 rounded-xl cursor-pointer border border-border bg-card"
          >
            <div className="flex gap-3 w-full">
              <Checkbox
                id={`checkbox-${task.id}`}
                checked={task.completed}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    onTaskCompletionChange(task.id, checked)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
              <div className="flex-1">
                <motion.h3
                  layoutId={`title-${task.id}-${id}`}
                  className="font-medium text-foreground text-left"
                >
                  {task.title}
                  {task.isImportant && <span className="ml-2 h-2 w-2 rounded-full bg-brand-pink inline-block" />}
                </motion.h3>
                <motion.p
                  layoutId={`description-${task.id}-${id}`}
                  className="text-muted-foreground text-left line-clamp-2"
                >
                  {task.description}
                </motion.p>
              </div>
            </div>
            {task.dueDate && (
              <motion.div
                layoutId={`due-date-${task.id}-${id}`}
                className="text-xs text-muted-foreground mt-2 w-full text-right"
              >
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </motion.div>
            )}
          </motion.div>
        ))}
      </ul>
    </>
  );
}

function EditTaskForm({ task }: { task: Task }) {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="space-y-4" onClick={stopPropagation}>
      <div>
        <label
          htmlFor={`title-${task.id}`}
          className="text-sm font-medium text-foreground block mb-2"
        >
          Title
        </label>
        <Input 
          id={`title-${task.id}`} 
          defaultValue={task.title}
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor={`description-${task.id}`}
          className="text-sm font-medium text-foreground block mb-2"
        >
          Description
        </label>
        <Textarea
          id={`description-${task.id}`}
          defaultValue={task.description || ''}
          className="h-24 w-full resize-none"
          placeholder="Add a description..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`due-date-${task.id}`}
            className="text-sm font-medium text-foreground block mb-2"
          >
            Due Date
          </label>
          <Input
            id={`due-date-${task.id}`}
            type="date"
            defaultValue={
              task.dueDate
                ? new Date(task.dueDate).toISOString().split('T')[0]
                : ''
            }
            className="w-full"
          />
        </div>

        <div>
          <label
            htmlFor={`priority-${task.id}`}
            className="text-sm font-medium text-foreground block mb-2"
          >
            Priority
          </label>
          <Select defaultValue={task.isImportant ? "high" : "normal"}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id={`important-${task.id}`}
          defaultChecked={task.isImportant}
        />
        <label
          htmlFor={`important-${task.id}`}
          className="text-sm font-medium text-foreground"
        >
          Mark as important
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-foreground"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
