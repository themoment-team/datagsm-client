import { NextRequest, NextResponse } from 'next/server';

import { backfillLoggedInCookie, forwardAccessToken } from '@repo/shared/server';

/**
 * 조회는 비로그인으로 열려 있어 페이지는 막지 않는다.
 * API 요청에는 토큰 쿠키를 Authorization 헤더로 옮겨 붙이고, 페이지 요청에는 로그인 표시 쿠키를 보충한다.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return forwardAccessToken(request);
  }

  return backfillLoggedInCookie(request, NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    '/api/:path*',
  ],
};
