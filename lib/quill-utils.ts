import { z } from "zod";

/**
 * Quill Delta format types and utilities
 */

// Quill Delta operation types
const QuillOpInsertSchema = z.object({
  insert: z.union([z.string(), z.record(z.any())]), // text or embed
  attributes: z.record(z.any()).optional(),
});

const QuillOpRetainSchema = z.object({
  retain: z.number(),
  attributes: z.record(z.any()).optional(),
});

const QuillOpDeleteSchema = z.object({
  delete: z.number(),
});

const QuillOpSchema = z.union([
  QuillOpInsertSchema,
  QuillOpRetainSchema,
  QuillOpDeleteSchema,
]);

// Quill Delta schema
export const QuillDeltaSchema = z.object({
  ops: z.array(QuillOpSchema),
});

export type QuillDelta = z.infer<typeof QuillDeltaSchema>;
export type QuillOp = z.infer<typeof QuillOpSchema>;

// Standard empty content for Quill
export const EMPTY_QUILL_CONTENT: QuillDelta = {
  ops: [{ insert: "\n" }],
};


/**
 * Extract plain text from Quill Delta
 */
export function deltaToPlainText(delta: QuillDelta): string {
  if (!delta || !delta.ops) return "";

  return delta.ops
    .map((op) => {
      if ("insert" in op && typeof op.insert === "string") {
        return op.insert;
      }
      return "";
    })
    .join("")
    .trim();
}

/**
 * Get a preview of content (first N characters)
 */
export function getDeltaPreview(delta: QuillDelta, maxLength: number = 100): string {
  const plainText = deltaToPlainText(delta);
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + "...";
}

/**
 * Check if Delta content is empty
 */
export function isDeltaEmpty(delta: QuillDelta): boolean {
  if (!delta || !delta.ops || delta.ops.length === 0) return true;

  // Check if only contains newlines or empty strings
  const text = deltaToPlainText(delta);
  return text.trim().length === 0;
}

/**
 * Validate if content is a valid Quill Delta
 */
export function isValidQuillDelta(content: any): content is QuillDelta {
  try {
    QuillDeltaSchema.parse(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert string content to Quill Delta
 */
export function stringToQuillDelta(text: string): QuillDelta {
  if (!text || text.trim().length === 0) {
    return EMPTY_QUILL_CONTENT;
  }

  return {
    ops: [
      { insert: text },
      { insert: "\n" },
    ],
  };
}

/**
 * Migrate content from various formats to Quill Delta
 */
export function migrateToQuillDelta(content: any): QuillDelta {
  // Already Quill Delta
  if (isValidQuillDelta(content)) {
    return content;
  }

  // Plain string
  if (typeof content === "string") {
    return stringToQuillDelta(content);
  }

  // Unknown format - return empty
  return EMPTY_QUILL_CONTENT;
}
