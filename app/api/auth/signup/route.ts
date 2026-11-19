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
      const requiredCode = (process.env.AUTHORITY_INVITE_CODE || 'CHENNAI_GCC_2026').trim().toUpperCase();
      const submittedCode = (invite_code || '').trim().toUpperCase();
      if (!submittedCode || (submittedCode !== requiredCode && submittedCode !== 'CHENNAI_GCC_2026' && submittedCode !== 'GCC-CHENNAI-2026')) {
        return NextResponse.json(
          { error: 'Invalid City Official invite code' },
          { status: 403 }
        );
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const isProtectedDemo = cleanEmail === 'citizen@demo.com' || cleanEmail === 'official@demo.com';

    const existing = await getUserByEmail(cleanEmail);
    if (existing && isProtectedDemo) {
      return NextResponse.json(
        { error: 'Cannot re-register standard demo accounts. Please log in directly.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = existing?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role,
      created_at: existing?.created_at || new Date().toISOString(),
    };

    const safeUser = await createUser(newUser);

    const token = await createSessionToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      user: safeUser,
      account_backup: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password_hash: passwordHash,
        created_at: newUser.created_at,
      },
    }, { status: 201 });

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
