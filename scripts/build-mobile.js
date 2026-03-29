/**
 * Mobile Build Script for QuackTrack
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');

console.log('=== Building QuackTrack Mobile APK ===\n');

const API_URL = 'https://quacktrack-dsvr.onrender.com';
console.log(`📡 API URL: ${API_URL}\n`);

const apiDir = path.join(rootDir, 'src/app/api');
const apiBackupDir = path.join(rootDir, '.api-backup-mobile');
const middlewareFile = path.join(rootDir, 'src/middleware.ts');
const middlewareBackup = path.join(rootDir, '.middleware-backup-mobile.ts');

function restore() {
  try {
    if (fs.existsSync(apiBackupDir)) {
      fs.cpSync(apiBackupDir, apiDir, { recursive: true });
      fs.rmSync(apiBackupDir, { recursive: true });
      console.log('   🔄 API routes restored');
    }
  } catch (e) {}
  try {
    if (fs.existsSync(middlewareBackup)) {
      fs.copyFileSync(middlewareBackup, middlewareFile);
      fs.rmSync(middlewareBackup);
      console.log('   🔄 Middleware restored');
    }
  } catch (e) {}
}

// Backup API routes
console.log('📦 Preparing for static export...');
try {
  if (fs.existsSync(apiBackupDir)) fs.rmSync(apiBackupDir, { recursive: true });
  if (fs.existsSync(apiDir)) {
    fs.cpSync(apiDir, apiBackupDir, { recursive: true });
    fs.rmSync(apiDir, { recursive: true });
    console.log('   ✅ API routes backed up and removed');
  }
} catch (e) {
  console.log('   ⚠️ Could not remove API routes:', e.message);
}

// Backup middleware
try {
  if (fs.existsSync(middlewareBackup)) fs.rmSync(middlewareBackup);
  if (fs.existsSync(middlewareFile)) {
    fs.copyFileSync(middlewareFile, middlewareBackup);
    fs.rmSync(middlewareFile);
    console.log('   ✅ Middleware backed up and removed');
  }
} catch (e) {
  console.log('   ⚠️ Could not remove middleware:', e.message);
}

// Build
console.log('\n🏗️  Building static export...');
try {
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      BUILD_TARGET: 'mobile',
      NEXT_PUBLIC_API_URL: API_URL
    }
  });
  console.log('   ✅ Build complete');
} catch (error) {
  console.error('   ❌ Build failed');
  restore();
  process.exit(1);
}

// Restore
console.log('\n🔄 Restoring files...');
restore();

// Inject API URL
const outDir = path.join(rootDir, 'out');
if (fs.existsSync(outDir)) {
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    if (!html.includes('__QUACKTRACK_API_URL__')) {
      html = html.replace('</head>', `<script>window.__QUACKTRACK_API_URL__="${API_URL}";</script></head>`);
      fs.writeFileSync(indexPath, html);
    }
    console.log('   ✅ API URL injected');
  }

  const files = fs.readdirSync(outDir);
  console.log(`   📁 ${files.length} files generated`);

  // Sync Capacitor
  console.log('\n📱 Syncing Capacitor...');
  try {
    execSync('npx cap sync android', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ Sync complete');
  } catch (e) {
    console.error('   ❌ Sync failed:', e.message);
  }
}

console.log('\n✅ Build Complete!');
console.log('\n📋 Build APK:');
console.log('   cd android');
console.log('   .\\gradlew assembleDebug');
console.log(`\n📱 App connects to: ${API_URL}`);
