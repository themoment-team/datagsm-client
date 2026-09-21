import { NextRequest, NextResponse } from 'next/server';

import { generateCodeChallenge, generateCodeVerifier, isValidRelativePath } from '@repo/shared/utils';

/**
 * 로그인 시작 엔드포인트.
 *
 * 조회는 비로그인으로 열려 있고 신청/관리/심사 액션에서만 로그인이 필요하므로,
 * 팝업(모달) 버튼에서도 로그인을 트리거할 수 있도록 서버 라우트로 분리했다.
 * PKCE code_verifier를 httpOnly 쿠키로 세팅한 뒤 OAuth authorize로 리다이렉트한다.
 * 로그인 완료 후에는 `/api/callback`이 토큰을 교환하고 `returnTo` 경로로 복귀시킨다.
 */
export async function GET(request: NextRequest) {
  const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
  const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI;

  if (!oauthBaseUrl || !clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const returnTo = request.nextUrl.searchParams.get('returnTo');
  const state = returnTo && isValidRelativePath(returnTo) ? returnTo : '/';

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authorizeUrl = new URL(`${oauthBaseUrl}/v1/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set('code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
