import { NextRequest, NextResponse } from 'next/server';

import { createOAuthAuthorizeRedirect } from '@repo/shared/server';

/**
 * 로그인 시작 엔드포인트.
 *
 * 조회는 비로그인으로 열려 있고 신청/관리/심사 액션에서만 로그인이 필요하므로,
 * 팝업(모달) 버튼에서도 로그인을 트리거할 수 있도록 서버 라우트로 분리했다.
 * PKCE code_verifier와 state nonce를 httpOnly 쿠키로 세팅한 뒤 OAuth authorize로 리다이렉트한다.
 * 로그인 완료 후에는 `/api/callback`이 토큰을 교환하고 `returnTo` 경로로 복귀시킨다.
 */
export async function GET(request: NextRequest) {
  const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
  const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI;

  if (!oauthBaseUrl || !clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 안전한 경로인지는 헬퍼가 검증해, 아니면 /로 돌아가게 한다.
  const returnPath = request.nextUrl.searchParams.get('returnTo') ?? '/';

  return createOAuthAuthorizeRedirect({ oauthBaseUrl, clientId, redirectUri, returnPath });
}
