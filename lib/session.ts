import { cookies, headers } from 'next/headers';
import { COOKIE_NAME, verifySessionToken, JWTPayload, checkRateLimit } from './auth-utils';
import { getUserById } from './db';
import { SafeUser } from './types';

export async function getCurrentSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const user = await getUserById(session.userId);
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user;
  return safe;
}

export function getClientIp(): string {
  const headerStore = headers();
  const forwarded = headerStore.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headerStore.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

export function enforceRateLimit(limit = 5): { allowed: boolean; remaining: number } {
  const ip = getClientIp();
  return checkRateLimit(ip, limit);
}
