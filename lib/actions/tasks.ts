'use server'

import { db } from '@/server/db';
import { tasks } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { action } from '@/lib/safe-action';
import { z } from 'zod';
import { ActionResponse } from '@/types/actions';
import { YooptaContentValue } from '@/types/yoopta';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.any().optional(), // Use z.any() for now due to complex YooptaContentValue structure
});

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.any().optional(), // Use z.any() for now due to complex YooptaContentValue structure
  status: z.enum(['pending', 'completed', 'important']).optional(),
  dueDate: z.date().nullable().optional(),
});

export const createTask = action
  .schema(createTaskSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { title, description } = parsedInput; // Changed from content to description
      if (!ctx.userId) {
        return {
          success: false,
          error: 'User not authenticated.',
        } as ActionResponse<null>;
      }

      const [newTask] = await db.insert(tasks).values({
        title,
        description: description || {}, // Changed from content to description
        status: 'pending',
        userId: ctx.userId,
      }).returning();

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
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...updateData } = parsedInput;

      const [updatedTask] = await db.update(tasks)
        .set(updateData)
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