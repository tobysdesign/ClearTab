'use server'

import { db } from '@/server/db';
import { tasks, BlockNoteContentSchema } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { action } from '@/lib/safe-action';
import { z } from 'zod';
import { ActionResponse } from '@/types/actions';
import { Block } from '@blocknote/core';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: BlockNoteContentSchema.optional(),
  isCompleted: z.boolean().default(false),
  isHighPriority: z.boolean().default(false), // Use isHighPriority
  dueDate: z.date().nullable().optional(),
  order: z.number().nullable().optional(),
});

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').optional(),
  content: BlockNoteContentSchema.optional(),
  isCompleted: z.boolean().optional(),
  isHighPriority: z.boolean().optional(), // Use isHighPriority
  dueDate: z.date().nullable().optional(),
  order: z.number().nullable().optional(),
});

export const createTask = action
  .schema(createTaskSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { title, content, isCompleted, isHighPriority, dueDate, order } = parsedInput; // Destructure all fields
      if (!ctx.userId) {
        return {
          success: false,
          error: 'User not authenticated.',
        } as ActionResponse<null>;
      }

      const [newTask] = await db.insert(tasks).values({
        title,
        content: content || [],
        isCompleted: isCompleted ?? false,
        isHighPriority: isHighPriority ?? false, // Use isHighPriority
        dueDate,
        order,
        userId: ctx.userId,
      } as typeof tasks.$inferInsert).returning();

      return {
        success: true,
        data: newTask,
      } as ActionResponse<typeof newTask>;
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        error: 'Failed to create task.',
      } as ActionResponse<null>;
    }
  });

export const updateTask = action
  .schema(updateTaskSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { id, ...updateData } = parsedInput;

      // Filter out undefined values to prevent Drizzle from trying to update with undefined
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );

      // Ensure userId is present in where clause if it's a restricted operation
      if (!ctx.userId) {
        return {
          success: false,
          error: 'User not authenticated.',
        } as ActionResponse<null>;
      }

      const [updatedTask] = await db.update(tasks)
        .set(filteredUpdateData)
        .where(eq(tasks.id, id))
        .returning();

      if (!updatedTask) {
        return {
          success: false,
          serverError: 'Task not found.',
        } as ActionResponse<null>;
      }

      return {
        success: true,
        data: updatedTask,
      } as ActionResponse<typeof updatedTask>;
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        error: 'Failed to update task.',
      } as ActionResponse<null>;
    }
  }); 