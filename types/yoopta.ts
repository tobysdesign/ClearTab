import { z } from "zod";
import type { YooptaContentValue, YooptaOnChangeOptions } from '@yoopta/editor';

export const yooptaNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  children: z.array(z.object({
    text: z.string(),
  })),
  props: z.object({
    nodeType: z.string(),
  }),
});

export const yooptaContentSchema = z.array(yooptaNodeSchema);

export type { YooptaContentValue, YooptaOnChangeOptions };

export const EMPTY_CONTENT: YooptaContentValue = {
  'root': {
    id: 'root',
    type: 'paragraph',
    value: [{
      id: 'initial',
      type: 'paragraph',
      children: [{ text: '' }],
      props: {
        nodeType: 'block',
      },
    }],
    meta: {
      order: 0,
      depth: 0,
    },
  },
}; 