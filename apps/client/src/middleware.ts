import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_KEYS, LOGIN_CANCELED_PATH } from '@repo/shared/constants';
import {
  backfillLoggedInCookie,
  createOAuthAuthorizeRedirect,
  forwardAccessToken,
} from '@repo/shared/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

  // API 경로는 로그인으로 보내지 않고, 토큰 쿠키를 백엔드로 넘길 Authorization 헤더로 옮겨 붙이기만 한다.
  if (pathname.startsWith('/api/')) {
    return forwardAccessToken(request);
  }

  // 로그인 취소 안내는 로그인하지 않은 채로 보는 화면이다. 인가로 보내면 거부한 동의 화면이 다시 뜬다.
  if (pathname === LOGIN_CANCELED_PATH) {
    return NextResponse.next();
  }

  if (!accessToken) {
    const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
    const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI;

    if (!oauthBaseUrl) {
      throw new Error('NEXT_PUBLIC_OAUTH_BASE_URL 환경 변수가 설정되지 않았습니다.');
    }
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_DATAGSM_CLIENT_ID 환경 변수가 설정되지 않았습니다.');
    }

    if (!redirectUri) {
      throw new Error('NEXT_PUBLIC_DATAGSM_REDIRECT_URI 환경 변수가 설정되지 않았습니다.');
    }

    return createOAuthAuthorizeRedirect({
      oauthBaseUrl,
      clientId,
      redirectUri,
      returnPath: request.nextUrl.pathname,
    });
  }

  return backfillLoggedInCookie(request, NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    '/api/:path*',
  ],
};
