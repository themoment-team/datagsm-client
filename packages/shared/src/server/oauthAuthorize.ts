import { NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';
import {
  createOAuthState,
  generateCodeChallenge,
  generateCodeVerifier,
  isValidRelativePath,
} from '@repo/shared/utils';

/**
 * verifier·nonce 쿠키 수명(15분).
 * 인가 서버의 인증 상태 토큰(10분)보다 길게 둬서, 로그인 화면에서 오래 머문 사용자도 콜백에서 쿠키를 잃지 않게 한다.
 */
const OAUTH_LOGIN_COOKIE_MAX_AGE = 60 * 15;

type OAuthLoginCookieKey = 'CODE_VERIFIER' | 'OAUTH_STATE';

/**
 * production에서는 이름에 `__Host-` 접두사를 붙인다. 브라우저는 이 접두사가 붙은 쿠키를 Secure·Path=/·Domain 없이
 * 심을 때만 받으므로, 같은 상위 도메인의 다른 서브도메인이 nonce와 verifier를 미리 심어 state 검증을 우회할 수 없다.
 * 개발 환경(http://localhost)에서는 Secure 쿠키를 쓰지 않으므로 접두사를 붙이지 않는다.
 */
export const getOAuthLoginCookieName = (key: OAuthLoginCookieKey) =>
  process.env.NODE_ENV === 'production' ? `__Host-${COOKIE_KEYS[key]}` : COOKIE_KEYS[key];

const oauthLoginCookieOptions = () =>
  ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  }) as const;

/** `__Host-` 쿠키는 Secure가 붙은 Set-Cookie로만 지울 수 있어, 심을 때와 같은 속성으로 만료시킨다. */
export const clearOAuthLoginCookies = (response: NextResponse) => {
  (['CODE_VERIFIER', 'OAUTH_STATE'] as const).forEach((key) => {
    response.cookies.set(getOAuthLoginCookieName(key), '', {
      ...oauthLoginCookieOptions(),
      maxAge: 0,
    });
  });
};

interface OAuthAuthorizeRedirectOptions {
  oauthBaseUrl: string;
  clientId: string;
  redirectUri: string;
  /**
   * 로그인을 마친 뒤 돌아갈 경로. state에 nonce와 함께 담겨 콜백이 그대로 리다이렉트에 쓴다.
   * 이 앱 안의 상대 경로가 아니면 /로 바꾼다.
   */
  returnPath: string;
}

/**
 * PKCE와 state nonce를 만들어 OAuth 인가 페이지로 보내는 응답을 만든다.
 * verifier와 nonce는 httpOnly 쿠키로 남겨, 콜백이 이 브라우저에서 시작한 로그인인지 확인하게 한다.
 */
export const createOAuthAuthorizeRedirect = async ({
  oauthBaseUrl,
  clientId,
  redirectUri,
  returnPath,
}: OAuthAuthorizeRedirectOptions) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const { nonce, state } = createOAuthState(isValidRelativePath(returnPath) ? returnPath : '/');

  const authorizeUrl = new URL(`${oauthBaseUrl}/v1/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOptions = { ...oauthLoginCookieOptions(), maxAge: OAUTH_LOGIN_COOKIE_MAX_AGE };
  response.cookies.set(getOAuthLoginCookieName('CODE_VERIFIER'), codeVerifier, cookieOptions);
  response.cookies.set(getOAuthLoginCookieName('OAUTH_STATE'), nonce, cookieOptions);

  return response;
};
