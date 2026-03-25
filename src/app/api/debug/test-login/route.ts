import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/debug/test-login - Test login directly
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('[TEST-LOGIN] Testing login for:', email);
    
    const user = await db.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log('[TEST-LOGIN] User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        email 
      });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    console.log('[TEST-LOGIN] Password match:', passwordMatch);
    
    if (!passwordMatch) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password',
        email: user.email 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('[TEST-LOGIN] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
