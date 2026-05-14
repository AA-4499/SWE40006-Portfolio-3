#!/usr/bin/env node

/**
 * Build script for Render deployment
 * Handles optional Prisma migrations based on DATABASE_URL availability
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`\n📦 ${message}`);
}

function error(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

try {
  log('Starting build process...');

  // Generate Prisma Client (always needed)
  log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Check if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    log('DATABASE_URL found. Running database migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      log('Migrations completed successfully');
    } catch (migrationError) {
      // If migrations fail, log warning but continue (database might not exist yet)
      console.warn('\n⚠️  Prisma migration warning (this is normal on first deploy)');
      console.warn(migrationError.message);
    }
  } else {
    console.warn('\n⚠️  DATABASE_URL not set. Skipping migrations.');
    console.warn('   Migrations will run on next deploy when DATABASE_URL is available.');
  }

  // Build Next.js
  log('Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });

  log('✅ Build completed successfully!');
} catch (err) {
  error(`Build failed: ${err.message}`);
}
