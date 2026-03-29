/**
 * Prepare mobile build for Capacitor
 * This script sets up the mobile build environment
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('=== Preparing QuackTrack for Mobile Build ===');

// Step 1: Check if .env.mobile exists, if not create it
const envMobilePath = path.join(rootDir, '.env.mobile');
if (!fs.existsSync(envMobilePath)) {
  console.log('Creating .env.mobile...');
  const envContent = `# Mobile App Environment Configuration
# IMPORTANT: Change NEXT_PUBLIC_API_URL to your deployed Next.js server
# This should be a full Next.js deployment (with API routes), NOT just a FastAPI backend

# Your deployed Next.js server URL (deploy to Vercel, Render, Railway, etc.)
NEXT_PUBLIC_API_URL=https://your-nextjs-app.vercel.app

# NextAuth configuration (should match your deployment)
NEXTAUTH_URL=https://your-nextjs-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Database URL (if your mobile app connects to a remote database)
# DATABASE_URL=your-production-database-url
`;
  fs.writeFileSync(envMobilePath, envContent);
  console.log('\n⚠️  IMPORTANT: Edit .env.mobile and set NEXT_PUBLIC_API_URL to your deployed Next.js server!');
}

// Step 2: Verify Next.js static export output
const outDir = path.join(rootDir, 'out');
if (!fs.existsSync(outDir)) {
  console.log('\n⚠️  Static export output not found at ./out');
  console.log('Run: BUILD_TARGET=mobile next build');
}

console.log('\n=== Mobile Build Instructions ===');
console.log('\n📱 For the mobile app to work, you need:');
console.log('   1. A deployed Next.js server (with API routes)');
console.log('   2. Set NEXT_PUBLIC_API_URL to that server URL');
console.log('\n🚀 Deployment options:');
console.log('   - Vercel: https://vercel.com (recommended for Next.js)');
console.log('   - Render: https://render.com');
console.log('   - Railway: https://railway.app');
console.log('\n📋 Build steps:');
console.log('   1. Deploy your Next.js app to a cloud provider');
console.log('   2. Edit .env.mobile with your deployment URL');
console.log('   3. Run: bun run mobile:build (or BUILD_TARGET=mobile next build)');
console.log('   4. Run: bunx cap sync android');
console.log('   5. Run: cd android && ./gradlew assembleDebug');
console.log('\n   APK will be at: android/app/build/outputs/apk/debug/app-debug.apk');
console.log('\n=== Preparation complete! ===');
