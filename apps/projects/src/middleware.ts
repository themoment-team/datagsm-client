import { NextRequest } from 'next/server';

import { forwardAccessToken } from '@repo/shared/server';

/** 조회는 비로그인으로 열려 있어 페이지는 막지 않고, API 요청에 토큰 쿠키를 Authorization 헤더로 옮겨 붙이기만 한다. */
export function middleware(request: NextRequest) {
  return forwardAccessToken(request);
}

export const config = {
  matcher: ['/api/:path*'],
};
