/**
 * Prepare standalone directory for Electron build
 * This script copies necessary files to the standalone directory
 * that Next.js standalone mode doesn't include by default
 */

const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
const nodeModulesDir = path.join(standaloneDir, 'node_modules');
const rootDir = path.join(__dirname, '..');

console.log('=== Preparing standalone directory for Electron build ===');
console.log(`Platform: ${process.platform}`);
console.log(`Standalone dir: ${standaloneDir}`);

// Ensure node_modules directory exists
if (!fs.existsSync(nodeModulesDir)) {
  fs.mkdirSync(nodeModulesDir, { recursive: true });
}

// Copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  Source not found: ${src}`);
    return false;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  console.log(`  Copied: ${src} -> ${dest}`);
  return true;
}

// Copy Prisma engines
console.log('\n=== Copying Prisma engines ===');
const prismaEnginesSrc = path.join(rootDir, 'node_modules', '@prisma', 'engines');
const prismaEnginesDest = path.join(nodeModulesDir, '@prisma', 'engines');

if (fs.existsSync(prismaEnginesSrc)) {
  // List what's in the engines directory
  console.log('Source engines directory contents:');
  const engineFiles = fs.readdirSync(prismaEnginesSrc);
  engineFiles.forEach(f => console.log(`  - ${f}`));
  
  // Check for query-engine files
  const queryEngineFiles = engineFiles.filter(f => 
    f.includes('query-engine') || f.includes('libquery_engine')
  );
  console.log('\nQuery engine files found:', queryEngineFiles);
  
  copyDir(prismaEnginesSrc, prismaEnginesDest);
  
  // Verify after copy
  console.log('\nDestination engines directory contents:');
  const destEngineFiles = fs.readdirSync(prismaEnginesDest);
  destEngineFiles.forEach(f => console.log(`  - ${f}`));
} else {
  console.log('WARNING: @prisma/engines not found in node_modules');
}

// Copy .prisma directory (Prisma client with query engine embedded)
console.log('\n=== Copying .prisma client ===');
const dotPrismaSrc = path.join(rootDir, 'node_modules', '.prisma');
const dotPrismaDest = path.join(nodeModulesDir, '.prisma');

if (fs.existsSync(dotPrismaSrc)) {
  // Check what's in .prisma/client
  const clientDir = path.join(dotPrismaSrc, 'client');
  if (fs.existsSync(clientDir)) {
    console.log('.prisma/client contents:');
    const clientFiles = fs.readdirSync(clientDir);
    clientFiles.forEach(f => console.log(`  - ${f}`));
    
    // Check for query engine in client
    const queryEngineInClient = clientFiles.filter(f => 
      f.includes('query-engine') || f.includes('libquery_engine')
    );
    if (queryEngineInClient.length > 0) {
      console.log('\nQuery engine files in .prisma/client:', queryEngineInClient);
    }
  }
  
  copyDir(dotPrismaSrc, dotPrismaDest);
} else {
  console.log('WARNING: .prisma not found in node_modules');
}

// Copy @prisma/client
console.log('\n=== Copying @prisma/client ===');
const prismaClientSrc = path.join(rootDir, 'node_modules', '@prisma', 'client');
const prismaClientDest = path.join(nodeModulesDir, '@prisma', 'client');

if (fs.existsSync(prismaClientSrc)) {
  copyDir(prismaClientSrc, prismaClientDest);
} else {
  console.log('WARNING: @prisma/client not found in node_modules');
}

// Copy @prisma/engines (for runtime engine lookup)
console.log('\n=== Copying @prisma/engines ===');
const prismaEnginesModuleSrc = path.join(rootDir, 'node_modules', '@prisma', 'engines');
const prismaEnginesModuleDest = path.join(nodeModulesDir, '@prisma', 'engines');

if (fs.existsSync(prismaEnginesModuleSrc)) {
  copyDir(prismaEnginesModuleSrc, prismaEnginesModuleDest);
} else {
  console.log('WARNING: @prisma/engines not found');
}

// Copy prisma schema directory
console.log('\n=== Copying prisma schema ===');
const prismaSchemaSrc = path.join(rootDir, 'prisma');
const prismaSchemaDest = path.join(standaloneDir, 'prisma');

if (fs.existsSync(prismaSchemaSrc)) {
  copyDir(prismaSchemaSrc, prismaSchemaDest);
} else {
  console.log('WARNING: prisma directory not found');
}

// IMPORTANT: Copy .env file from root to standalone (overwrites any existing)
console.log('\n=== Copying .env file ===');
const envSrc = path.join(rootDir, '.env');
const envDest = path.join(standaloneDir, '.env');

if (fs.existsSync(envSrc)) {
  // Read the source .env to verify content
  const envContent = fs.readFileSync(envSrc, 'utf8');
  console.log('Source .env content preview:');
  let lineCount = 0;
  envContent.split('\n').forEach((line) => {
    if (line.trim() && !line.startsWith('#')) {
      lineCount++;
      const [key, ...vals] = line.split('=');
      const value = vals.join('=');
      // Mask sensitive values
      const maskedValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`  ${key}=${maskedValue}`);
    }
  });
  console.log(`Total env vars: ${lineCount}`);
  
  fs.copyFileSync(envSrc, envDest);
  console.log(`\nCopied .env to: ${envDest}`);
  
  // Verify the copy
  const copiedContent = fs.readFileSync(envDest, 'utf8');
  console.log(`Verified .env file size: ${copiedContent.length} bytes`);
} else {
  console.log('WARNING: .env file not found in root directory!');
  console.log(`Expected location: ${envSrc}`);
}

// Final summary
console.log('\n=== Final standalone/node_modules contents ===');
try {
  const modules = fs.readdirSync(nodeModulesDir);
  console.log(modules.join(', '));
} catch (e) {
  console.log('Could not list node_modules');
}

console.log('\n=== Standalone preparation complete! ===');
