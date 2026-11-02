import { NextResponse } from 'next/server';

import { clearAuthCookies } from './authCookies';

/**
 * 로그아웃(`/api/logout`) POST 핸들러. httpOnly 토큰 쿠키는 브라우저에서 지울 수 없어 서버에서 지운다.
 * IdP 세션은 OAuth 서버 도메인의 쿠키라 여기서 끊지 않으며, 호출하는 쪽에서 따로 로그아웃한다.
 *
 * 주의: 이 브라우저의 쿠키만 지울 뿐 발급된 refresh token을 OAuth 서버에서 무효화하지는 않는다.
 * 이미 유출된 토큰은 만료(30일)까지 쓸 수 있으므로, 서버가 revoke를 지원하면 여기서 함께 호출해야 한다. (#266)
 */
export const logoutHandler = async () => {
  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
};
