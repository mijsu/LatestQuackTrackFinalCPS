import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/debug/check-user - Check if user exists and password works
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email') || 'admin@ptc.edu.ph';
    const password = request.nextUrl.searchParams.get('password') || 'password123';
    
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found', email });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    return NextResponse.json({
      found: true,
      email: user.email,
      name: user.name,
      role: user.role,
      passwordValid: isValid,
      passwordHash: user.password.substring(0, 30) + '...',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
