#!/usr/bin/env node

/**
 * Pre-warm API routes in development to reduce first-request compilation time
 * This script hits all API endpoints to trigger Next.js compilation
 */

const http = require('http');

const API_ROUTES = [
  '/api/notes',
  '/api/tasks',
  '/api/calendar',
  '/api/calendar/status',
  '/api/settings/count',
  '/api/settings/countdown',
  '/api/settings/accounts',
  '/api/settings/disconnect-calendar',
  '/api/accounts/force-revoke-check'
];

const BASE_URL = process.env.PREWARM_URL || 'http://localhost:3000';
const TIMEOUT = 60000; // 60 seconds timeout per request

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`🔥 Pre-warming: ${path}`);

    const startTime = Date.now();
    const req = http.get(url, { timeout: TIMEOUT }, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ ${path} - ${res.statusCode} (${duration}ms)`);

      // Consume response data to prevent memory leaks
      res.on('data', () => {});
      res.on('end', () => resolve({ path, status: res.statusCode, duration }));
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      console.log(`⏰ ${path} - timeout (${duration}ms)`);
      resolve({ path, status: 'timeout', duration });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${path} - error: ${err.message} (${duration}ms)`);
      resolve({ path, status: 'error', duration, error: err.message });
    });
  });
}

async function prewarmRoutes() {
  console.log('🚀 Starting API route pre-warming...');
  console.log(`📡 Base URL: ${BASE_URL}`);

  const startTime = Date.now();
  const results = [];

  // Pre-warm routes sequentially to avoid overwhelming the server
  for (const route of API_ROUTES) {
    const result = await makeRequest(route);
    results.push(result);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const totalTime = Date.now() - startTime;

  console.log('\n📊 Pre-warming Summary:');
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📈 Routes processed: ${results.length}`);

  const successful = results.filter(r => r.status === 200 || r.status === 404);
  const failed = results.filter(r => r.status !== 200 && r.status !== 404);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed routes:');
    failed.forEach(r => {
      console.log(`  ${r.path} - ${r.status} ${r.error ? `(${r.error})` : ''}`);
    });
  }

  console.log('\n🎯 Pre-warming complete! Next requests should be faster.');
}

// Wait for server to be ready before pre-warming
async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await makeRequest('/');
      console.log('✅ Server is ready');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.log('❌ Server not ready after 30 seconds');
  return false;
}

async function main() {
  console.log('🔍 Waiting for Next.js server...');

  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  await prewarmRoutes();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { prewarmRoutes, waitForServer };