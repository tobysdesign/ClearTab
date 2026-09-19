'use server'

import { db } from '@/lib/db';
import { notes } from '@/shared/schema';
import { action } from '@/lib/safe-action';
import { z } from 'zod';
import { ActionResponse } from '@/types/actions';

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.any().optional(), // Using any for Quill content to match the database jsonb
});

export const createNote = action
  .schema(createNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { title, content } = parsedInput;
      if (!ctx.userId) {
        return {
          success: false,
          error: 'User not authenticated.',
        } as ActionResponse<null>;
      }

      const [newNote] = await db.insert(notes).values({
        title,
        content: content || [],
        userId: ctx.userId,
      } as any).returning();

      return {
        success: true,
        data: newNote,
      } as ActionResponse<typeof newNote>;
    } catch (error) {
      console.error('Error creating note:', error);
      return {
        success: false,
        error: 'Failed to create note.',
      } as ActionResponse<null>;
    }
  });
