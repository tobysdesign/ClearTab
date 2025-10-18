import { z } from "zod";

/**
 * Quill Delta format types and utilities
 * Replaces BlockNote for lighter bundle size
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
 * Convert BlockNote content to Quill Delta format
 * For migration from existing BlockNote data
 */
export function blockNoteToQuillDelta(blockNoteContent: any): QuillDelta {
  if (!blockNoteContent || !Array.isArray(blockNoteContent)) {
    return EMPTY_QUILL_CONTENT;
  }

  const ops: QuillOp[] = [];

  for (const block of blockNoteContent) {
    if (!block || typeof block !== "object") continue;

    // Handle different block types
    switch (block.type) {
      case "paragraph":
        if (block.content && Array.isArray(block.content)) {
          for (const textNode of block.content) {
            if (textNode.type === "text" && textNode.text) {
              const attributes: Record<string, any> = {};

              // Convert BlockNote styles to Quill attributes
              if (textNode.styles) {
                if (textNode.styles.bold) attributes.bold = true;
                if (textNode.styles.italic) attributes.italic = true;
                if (textNode.styles.underline) attributes.underline = true;
                if (textNode.styles.strike) attributes.strike = true;
              }

              ops.push({
                insert: textNode.text,
                ...(Object.keys(attributes).length > 0 && { attributes }),
              });
            }
          }
        }
        ops.push({ insert: "\n" }); // Paragraph break
        break;

      case "heading":
        const level = block.props?.level || 1;
        if (block.content && Array.isArray(block.content)) {
          for (const textNode of block.content) {
            if (textNode.type === "text" && textNode.text) {
              ops.push({ insert: textNode.text });
            }
          }
        }
        ops.push({ insert: "\n", attributes: { header: level } });
        break;

      case "bulletListItem":
      case "numberedListItem":
        if (block.content && Array.isArray(block.content)) {
          for (const textNode of block.content) {
            if (textNode.type === "text" && textNode.text) {
              ops.push({ insert: textNode.text });
            }
          }
        }
        ops.push({
          insert: "\n",
          attributes: { list: block.type === "bulletListItem" ? "bullet" : "ordered" },
        });
        break;

      default:
        // For unknown blocks, try to extract text content
        if (block.content && Array.isArray(block.content)) {
          for (const textNode of block.content) {
            if (textNode.type === "text" && textNode.text) {
              ops.push({ insert: textNode.text });
            }
          }
          ops.push({ insert: "\n" });
        }
        break;
    }
  }

  // Ensure we have at least one operation
  if (ops.length === 0) {
    return EMPTY_QUILL_CONTENT;
  }

  return { ops };
}

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

  // BlockNote format
  if (Array.isArray(content)) {
    return blockNoteToQuillDelta(content);
  }

  // Plain string
  if (typeof content === "string") {
    return stringToQuillDelta(content);
  }

  // Unknown format - return empty
  return EMPTY_QUILL_CONTENT;
}