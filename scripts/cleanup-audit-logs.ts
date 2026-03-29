/**
 * Script to clean up orphaned audit logs
 * Run with: bun --env-file=.env run scripts/cleanup-audit-logs.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Manually load DATABASE_URL from .env file BEFORE importing Prisma
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
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env.DATABASE_URL = cleanValue
        console.log('✅ DATABASE_URL loaded from .env:', cleanValue.substring(0, 50) + '...')
        break
      }
    }
  }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting audit log cleanup...')
  
  try {
    // Find all audit logs with userId that don't have a matching user
    const orphanedLogs = await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
      SELECT al.id, al."userId"
      FROM "AuditLog" al
      LEFT JOIN "User" u ON al."userId" = u.id
      WHERE al."userId" IS NOT NULL AND u.id IS NULL
    `

    console.log(`Found ${orphanedLogs.length} orphaned audit logs`)

    // Set userId to null for orphaned logs
    if (orphanedLogs.length > 0) {
      const orphanedIds = orphanedLogs.map(log => log.id)
      
      const result = await prisma.auditLog.updateMany({
        where: {
          id: { in: orphanedIds }
        },
        data: {
          userId: null
        }
      })
      
      console.log(`Updated ${result.count} audit logs`)
    }

    console.log('Cleanup completed successfully!')
  } catch (error) {
    console.error('Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
