import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';

/**
 * `/api/*` 요청에 httpOnly accessToken 쿠키를 Authorization 헤더로 옮겨 붙인다.
 * 미들웨어에서 바꾼 요청 헤더는 next.config의 rewrites 프록시로 백엔드까지 그대로 전달된다.
 * 요청이 이미 Authorization을 담고 있으면 덮어쓰지 않는다.
 */
export const forwardAccessToken = (request: NextRequest) => {
  const accessToken = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

  if (!accessToken || request.headers.has('Authorization')) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  return NextResponse.next({ request: { headers } });
};
