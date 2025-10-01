// Lightweight Supabase stub for Chrome extension builds
// Reduces bundle size by eliminating server-side Supabase functionality

export const createClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
});

export * from '@supabase/supabase-js';
