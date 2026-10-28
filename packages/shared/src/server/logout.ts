import { NextResponse } from 'next/server';

import { clearAuthCookies } from './authCookies';

/**
 * 로그아웃(`/api/logout`) POST 핸들러. httpOnly 토큰 쿠키는 브라우저에서 지울 수 없어 서버에서 지운다.
 * IdP 세션은 OAuth 서버 도메인의 쿠키라 여기서 끊지 않으며, 호출하는 쪽에서 따로 로그아웃한다.
 */
export const logoutHandler = async () => {
  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
};
