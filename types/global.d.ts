// Add minimal ambient declarations for optional/missing third-party packages so the TypeScript compiler doesn’t error.

declare module 'mem0ai' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class MemoryClient { constructor(options: any); add: any; getAll: any; search: any; delete: any; update: any; }
}

declare module '@storybook/nextjs-vite';
declare module 'storybook/test';
declare module '@storybook/addon-vitest/vitest-plugin';

declare module '@yoopta/editor' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type YooptaContentValue = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type YooptaOnChangeOptions = any;
}

declare module 'vitest/config';

// Fallback for any other untyped modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module '*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export = value;
}

// NextAuth shims
declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const getServerSession: any;
}

declare module 'next-auth/jwt' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const getToken: any;
}

declare module 'next-auth/adapters' {
  export interface AdapterAccount {
    [key: string]: any;
  }
}