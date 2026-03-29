#!/usr/bin/env node
/**
 * Postinstall script with workaround for JuiceFS .config conflict
 * This handles the case where .config is a file (JuiceFS config) instead of a directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const configPath = path.join(process.cwd(), '.config');
const configBackupPath = path.join(process.cwd(), '.config.juicefs.backup');

function runPrismaGenerate() {
  console.log('Generating Prisma client...');
  try {
    execSync('bunx prisma generate --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('Prisma client generated successfully');
  } catch (error) {
    console.error('Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
}

// Check if .config exists and is a file (not a directory)
if (fs.existsSync(configPath)) {
  const stats = fs.statSync(configPath);
  
  if (stats.isFile()) {
    console.log('Detected JuiceFS .config file, creating workaround...');
    
    try {
      // Backup the JuiceFS config file
      fs.renameSync(configPath, configBackupPath);
      console.log('Backed up JuiceFS config to .config.juicefs.backup');
      
      // Create .config directory for Prisma
      fs.mkdirSync(configPath, { recursive: true });
      console.log('Created .config directory');
      
      // Run prisma generate
      runPrismaGenerate();
      
      // Restore the JuiceFS config
      fs.rmSync(configPath, { recursive: true, force: true });
      fs.renameSync(configBackupPath, configPath);
      console.log('Restored JuiceFS config');
    } catch (error) {
      console.error('Error during Prisma generation:', error.message);
      
      // Try to restore backup if it exists
      if (fs.existsSync(configBackupPath)) {
        try {
          if (fs.existsSync(configPath) && fs.statSync(configPath).isDirectory()) {
            fs.rmSync(configPath, { recursive: true, force: true });
          }
          fs.renameSync(configBackupPath, configPath);
          console.log('Restored JuiceFS config after error');
        } catch (restoreError) {
          console.error('Failed to restore JuiceFS config:', restoreError.message);
        }
      }
      
      process.exit(1);
    }
  } else {
    // .config is already a directory, just run prisma generate
    runPrismaGenerate();
  }
} else {
  // .config doesn't exist, just run prisma generate
  runPrismaGenerate();
}

console.log('Postinstall completed successfully');
