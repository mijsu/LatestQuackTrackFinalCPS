import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// This endpoint only ensures the admin account exists
// No demo data is created in production
export async function POST() {
  try {
    console.log('🔧 Ensuring admin account exists...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await db.user.upsert({
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

    return NextResponse.json({
      success: true,
      message: 'Admin account is ready',
      adminEmail: admin.email,
    });
  } catch (error) {
    console.error('❌ Failed to ensure admin account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create admin account', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminExists = await db.user.findUnique({
      where: { email: 'admin@ptc.edu.ph' },
    });

    return NextResponse.json({
      seeded: !!adminExists,
      message: adminExists 
        ? 'Admin account exists' 
        : 'Admin account needs to be created. Call POST /api/seed.',
    });
  } catch (error) {
    return NextResponse.json({
      seeded: false,
      error: 'Failed to check admin status',
      details: String(error),
    });
  }
}
