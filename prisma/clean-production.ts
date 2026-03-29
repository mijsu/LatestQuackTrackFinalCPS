/**
 * Clean Production Database
 * Removes all seed data but keeps the admin account
 */

import { config } from 'dotenv';
config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning production database...\n');

  // Step 1: Delete all data except admin user
  console.log('📋 Removing seed data...');

  try {
    // Delete in correct order (respecting foreign key constraints)
    await prisma.auditLog.deleteMany({});
    console.log('   ✅ Audit logs deleted');

    await prisma.schedule.deleteMany({});
    console.log('   ✅ Schedules deleted');

    await prisma.facultyPreference.deleteMany({});
    console.log('   ✅ Faculty preferences deleted');

    await prisma.subject.deleteMany({});
    console.log('   ✅ Subjects deleted');

    await prisma.room.deleteMany({});
    console.log('   ✅ Rooms deleted');

    await prisma.section.deleteMany({});
    console.log('   ✅ Sections deleted');

    // Delete all users EXCEPT admin
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@ptc.edu.ph'
        }
      }
    });
    console.log('   ✅ Faculty users deleted (admin preserved)');

    await prisma.department.deleteMany({});
    console.log('   ✅ Departments deleted');

  } catch (error: any) {
    console.log('   ⚠️ Some tables may already be empty:', error?.message || error);
  }

  // Step 2: Ensure admin account exists
  console.log('\n👤 Ensuring admin account...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ptc.edu.ph' },
    update: {
      password: hashedPassword,
    },
    create: {
      uid: 'admin-001',
      name: 'System Administrator',
      email: 'admin@ptc.edu.ph',
      password: hashedPassword,
      role: 'admin',
      maxUnits: 24,
      specialization: '[]',
    },
  });
  
  console.log('   ✅ Admin account ready');
  console.log(`   📧 Email: ${admin.email}`);
  console.log('   🔑 Password: password123');

  console.log('\n✅ Database cleaned successfully!');
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
