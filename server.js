#!/usr/bin/env node

/**
 * Production Server for Jagoan Hosting cPanel
 * Runs Next.js application on specified port
 */

const { spawn } = require('child_process');
const path = require('path');

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB...');
console.log(`📱 Port: ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);

// Start Next.js production server
const nextStart = spawn('node', [require.resolve('next/dist/bin/next'), 'start'], {
  cwd: __dirname,
  env: {
    ...process.env,
    PORT,
    NODE_ENV: 'production',
  },
  stdio: 'inherit',
});

nextStart.on('error', (err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});

nextStart.on('exit', (code) => {
  console.log(`⚠️ Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM signal received: closing HTTP server');
  nextStart.kill();
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT signal received: closing HTTP server');
  nextStart.kill();
});
