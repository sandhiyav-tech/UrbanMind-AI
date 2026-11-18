import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { SafeUser, UserRole } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'super_secret_urbanmind_jwt_signing_key_at_least_32_characters_long'
);

export const COOKIE_NAME = 'um_session';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}

// In-memory rate limiting (5 req / min / IP)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

export function validatePasswordStrength(password: string): boolean {
  // Password at least 8 chars with a letter and a number
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}
