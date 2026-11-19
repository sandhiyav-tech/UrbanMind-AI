import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth-utils';
import { getUserByEmail } from '@/lib/db';
import { enforceRateLimit } from '@/lib/session';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  account_backup: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['citizen', 'authority']),
    password_hash: z.string(),
    created_at: z.string(),
  }).optional(),
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
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { email, password, account_backup } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    let user = await getUserByEmail(cleanEmail);

    // If user is not found in this serverless container, re-hydrate from account_backup
    if (!user && account_backup && account_backup.email.trim().toLowerCase() === cleanEmail) {
      try {
        const { createUser } = await import('@/lib/db');
        user = {
          id: account_backup.id,
          name: account_backup.name,
          email: cleanEmail,
          password_hash: account_backup.password_hash,
          role: account_backup.role,
          created_at: account_backup.created_at,
        };
        await createUser(user);
      } catch (err) {
        console.warn('Could not re-hydrate user from backup:', err);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = user;

    const token = await createSessionToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const redirectUrl = safeUser.role === 'authority' ? '/review' : '/';

    const response = NextResponse.json({
      user: safeUser,
      redirectUrl,
    });

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
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
