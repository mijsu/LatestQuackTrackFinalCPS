#!/bin/bash
# Render build script with workaround for JuiceFS .config conflict

set -e

echo "Starting Render build..."

# Workaround for JuiceFS .config file conflict on Render
# Prisma expects .config to be a directory, but on Render it's a JuiceFS config file
if [ -f ".config" ]; then
  echo "Detected JuiceFS .config file, creating temporary workaround..."
  # Move the JuiceFS config file temporarily
  mv .config .config.juicefs.backup
  # Create .config directory for Prisma
  mkdir -p .config
fi

# Generate Prisma client
echo "Generating Prisma client..."
bunx prisma generate --schema=./prisma/schema.prisma

# Run database migrations/push
echo "Running database push..."
bunx prisma db push --schema=./prisma/schema.prisma --accept-data-loss || true

# Build Next.js
echo "Building Next.js application..."
bunx next build

# Restore JuiceFS config if we backed it up
if [ -f ".config.juicefs.backup" ]; then
  echo "Restoring JuiceFS config..."
  rm -rf .config
  mv .config.juicefs.backup .config
fi

echo "Build completed successfully!"
