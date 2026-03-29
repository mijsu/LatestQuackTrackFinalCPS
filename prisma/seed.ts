import { config } from 'dotenv';
config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up production database...');

  // Hash password for admin account
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create ONLY admin user - no demo data
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ptc.edu.ph' },
    update: {},
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
  
  console.log(`✅ Admin account ready: ${admin.email}`);
  console.log('📋 Login credentials: admin@ptc.edu.ph / password123');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
