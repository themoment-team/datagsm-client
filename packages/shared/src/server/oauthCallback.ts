import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';
import { isValidRelativePath } from '@repo/shared/utils';

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
 */
export const createOAuthCallbackHandler =
  ({ getClientSecret }: OAuthCallbackHandlerOptions = {}) =>
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
      const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
      const clientSecret = getClientSecret?.();
      const redirectUri = process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI;
      const codeVerifier = request.cookies.get('code_verifier')?.value;

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

      const targetPath = state && isValidRelativePath(state) ? state : '/';
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

      response.cookies.delete('code_verifier');

      return response;
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  };
