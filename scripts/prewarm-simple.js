#!/usr/bin/env node

/**
 * Simple pre-warming script for development
 * Just hits the main API routes to trigger compilation
 */

const BASE_URL = 'http://localhost:3000';

const routes = [
  '/api/notes',
  '/api/tasks'
];

async function prewarm() {
  console.log('🔥 Pre-warming API routes...');

  for (const route of routes) {
    try {
      console.log(`📡 ${route}`);
      const response = await fetch(`${BASE_URL}${route}`, {
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      console.log(`✅ ${route} - ${response.status}`);
    } catch (error) {
      console.log(`❌ ${route} - ${error.message}`);
    }
  }

  console.log('🎯 Pre-warming complete!');
}

prewarm().catch(console.error);