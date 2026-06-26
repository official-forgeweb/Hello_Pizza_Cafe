import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match /loyalty followed by 10 to 15 digits (standard phone number lengths)
  const loyaltyPhoneRegex = /^\/loyalty(\d{10,15})$/;
  const match = pathname.match(loyaltyPhoneRegex);

  if (match) {
    const phone = match[1];
    const url = request.nextUrl.clone();
    url.pathname = '/loyalty';
    url.searchParams.set('phone', phone);
    
    // Rewrite internally so the browser URL remains /loyalty9310065542
    // but Next.js processes the request as /loyalty?phone=9310065542
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all page routes to allow dynamic interception of /loyalty[phone]
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
