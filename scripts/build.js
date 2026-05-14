#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Build script for Render deployment
 * Handles optional Prisma migrations based on DATABASE_URL availability
 */

const { execSync } = require('child_process');

function log(message) {
  console.log(`\n?? ${message}`);
}

function error(message) {
  console.error(`\n? ${message}`);
  process.exit(1);
}

try {
  // Try to run migrations if DATABASE_URL is present
  if (process.env.DATABASE_URL) {
    log('Syncing database schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } catch (migrationError) {
      console.warn('\n?? Database migration warning (this is normal on first deploy or if schema is already in sync)');
      console.warn(migrationError.message);
    }
  } else {
    console.warn('\n?? DATABASE_URL not set. Skipping database schema sync.');
    console.warn('   Schema sync will run on next deploy when DATABASE_URL is available.');
  }

  // Build Next.js
  log('Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });

  log('? Build completed successfully!');
} catch (err) {
  error(`Build failed: ${err.message}`);
}
