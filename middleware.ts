import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'super_secret_urbanmind_jwt_signing_key_at_least_32_characters_long'
);

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files and internal Next.js assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public authentication pages
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('um_session')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = (payload as any).role as string;

    // Authority-only routes: /review and /evaluation
    if (pathname.startsWith('/review') || pathname.startsWith('/evaluation')) {
      if (role !== 'authority') {
        // Redirect citizens away from authority-restricted pages
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    // Invalid or expired token -> redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('um_session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
