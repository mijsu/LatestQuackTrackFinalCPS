// Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

// Manually load and set DATABASE_URL from .env file
// This is needed because the system has a default DATABASE_URL set to SQLite
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8')
  const lines = envContent.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key === 'DATABASE_URL') {
        const value = valueParts.join('=').trim()
        // Remove surrounding quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env.DATABASE_URL = cleanValue
        console.log('✅ DATABASE_URL loaded from .env:', cleanValue.substring(0, 50) + '...')
        break
      }
    }
  }
}

// Also load other env vars from .env
config({ path: envPath, override: true })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!')
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Handle connection cleanup on process exit
process.on('beforeExit', async () => {
  await db.$disconnect()
})
