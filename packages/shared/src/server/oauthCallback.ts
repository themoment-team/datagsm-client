import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_KEYS, LOGIN_CANCELED_PATH } from '@repo/shared/constants';
import { isValidRelativePath, parseOAuthState } from '@repo/shared/utils';

interface OAuthCallbackHandlerOptions {
  /**
   * 토큰 교환에 함께 보낼 client_secret. 시크릿을 쓰는 클라이언트(어드민)만 넘긴다.
   * 넘겼는데 값이 비어 있으면 설정 누락으로 보고 교환하지 않는다.
   */
  getClientSecret?: () => string | undefined;
}

/**
 * OAuth 로그인 콜백(`/api/callback`) GET 핸들러를 만든다.
 * code를 토큰으로 교환해 쿠키에 심고 state 경로로 보내며, 어느 단계든 실패하면 /로 돌려보낸다.
 * 인가 서버가 error를 돌려주면(동의 거부 등) 로그인 취소 안내 화면으로 보낸다.
 *
 * state의 nonce가 쿠키와 다르거나 code_verifier 쿠키가 없으면 이 브라우저가 시작한 로그인이 아니므로 교환하지 않는다.
 * 남이 발급받은 code로 피해자를 공격자 계정에 로그인시키는 로그인 CSRF를 막기 위해서다.
 * 시크릿 클라이언트는 서버가 PKCE를 강제하지 않을 수 있어 code_verifier 확인만으로는 부족하다.
 */
export const createOAuthCallbackHandler =
  ({ getClientSecret }: OAuthCallbackHandlerOptions = {}) =>
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const returnPath = parseOAuthState(
        searchParams.get('state'),
        request.cookies.get(COOKIE_KEYS.OAUTH_STATE)?.value,
      );
      const targetPath = returnPath && isValidRelativePath(returnPath) ? returnPath : '/';

      // 동의를 거부하거나(access_denied) 요청을 처리하지 못하면 인가 서버는 code 대신 error를 붙여 돌려보낸다.
      // /로 보내면 미들웨어가 곧바로 인가를 다시 시작해 같은 동의 화면이 다시 뜨므로 안내 화면으로 보낸다.
      if (error) {
        const canceledUrl = new URL(LOGIN_CANCELED_PATH, request.url);
        canceledUrl.searchParams.set('error', error);
        canceledUrl.searchParams.set('returnTo', targetPath);
        return NextResponse.redirect(canceledUrl);
      }

      const codeVerifier = request.cookies.get(COOKIE_KEYS.CODE_VERIFIER)?.value;

      if (!code || returnPath === null || !codeVerifier) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
      const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
      const clientSecret = getClientSecret?.();
      const redirectUri = process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI;

      if (!oauthBaseUrl || !clientId || (getClientSecret && !clientSecret) || !redirectUri) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const tokenResponse = await fetch(`${oauthBaseUrl}/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          ...(getClientSecret ? { client_secret: clientSecret } : {}),
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const tokenData = await tokenResponse.json();

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      if (!accessToken || !refreshToken) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const redirectUrl = new URL(targetPath, request.url);
      const response = NextResponse.redirect(redirectUrl);

      // 쿠키 설정
      response.cookies.set(COOKIE_KEYS.ACCESS_TOKEN, accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60, // 1시간
      });

      response.cookies.set(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30일
      });

      response.cookies.delete(COOKIE_KEYS.CODE_VERIFIER);
      response.cookies.delete(COOKIE_KEYS.OAUTH_STATE);

      return response;
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  };
