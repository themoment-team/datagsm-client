import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';

import { clearAuthCookies, setAuthCookies } from './authCookies';
import type { OAuthCallbackHandlerOptions } from './oauthCallback';

/**
 * OAuth 토큰 엔드포인트(/v1/oauth/token)는 공통 래핑({ status, code, message, data })에서
 * 의도적으로 제외돼 토큰 필드가 최상위로 온다. grant_type에 따라 refresh_token은 없을 수 있다.
 */
interface OAuthTokenRefreshResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string | null;
  scope?: string;
}

/**
 * 토큰 갱신(`/api/refresh`) POST 핸들러를 만든다. 로그인 콜백과 같은 클라이언트 설정을 쓴다.
 * httpOnly refresh token 쿠키로 OAuth 서버에서 새 토큰을 받아 쿠키를 바꾸고 204로 응답한다.
 * 어느 단계든 실패하면 쿠키를 모두 지우고 401로 응답해, 클라이언트가 다시 로그인하게 한다.
 */
export const createTokenRefreshHandler =
  ({ getClientSecret }: OAuthCallbackHandlerOptions = {}) =>
  async (request: NextRequest) => {
    const unauthorized = () => {
      const response = NextResponse.json({ error: 'invalid_grant' }, { status: 401 });
      clearAuthCookies(response);
      return response;
    };

    try {
      const refreshToken = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
      const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
      const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
      const clientSecret = getClientSecret?.();

      if (!refreshToken || !oauthBaseUrl || !clientId || (getClientSecret && !clientSecret)) {
        return unauthorized();
      }

      const tokenResponse = await fetch(`${oauthBaseUrl}/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          ...(getClientSecret ? { client_secret: clientSecret } : {}),
        }),
      });

      if (!tokenResponse.ok) {
        return unauthorized();
      }

      const tokenData: OAuthTokenRefreshResponse = await tokenResponse.json();

      if (!tokenData.access_token) {
        return unauthorized();
      }

      const response = new NextResponse(null, { status: 204 });
      setAuthCookies(response, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });

      return response;
    } catch {
      return unauthorized();
    }
  };
