// Fallback start script for Render compatibility
// This file ensures the correct entry point is used regardless of Render configuration

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'server.js');

// Check if the dist folder exists
if (!fs.existsSync(distPath)) {
  console.log('dist/server.js not found. Building...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Start the server
console.log('Starting server from dist/server.js...');
require('./dist/server.js');
