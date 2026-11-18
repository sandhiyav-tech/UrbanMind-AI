import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS, validatePasswordStrength } from '@/lib/auth-utils';
import { getUserByEmail, createUser } from '@/lib/db';
import { enforceRateLimit } from '@/lib/session';

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['citizen', 'authority']),
  invite_code: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimit = enforceRateLimit(5);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute before trying again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration data' },
        { status: 400 }
      );
    }

    const { name, email, password, role, invite_code } = parsed.data;

    if (!validatePasswordStrength(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long and contain both letters and numbers' },
        { status: 400 }
      );
    }

    // Server-side authority verification
    if (role === 'authority') {
      const requiredCode = process.env.AUTHORITY_INVITE_CODE || 'CHENNAI_GCC_2026';
      if (!invite_code || invite_code.trim() !== requiredCode.trim()) {
        return NextResponse.json(
          { error: 'Invalid City Official invite code' },
          { status: 403 }
        );
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString(),
    };

    const safeUser = await createUser(newUser);

    const token = await createSessionToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ user: safeUser }, { status: 201 });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
