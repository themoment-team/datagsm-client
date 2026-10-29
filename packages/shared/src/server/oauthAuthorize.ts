import { NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';
import { createOAuthState, generateCodeChallenge, generateCodeVerifier } from '@repo/shared/utils';

/**
 * verifier·nonce 쿠키 수명(15분).
 * 인가 서버의 인증 상태 토큰(10분)보다 길게 둬서, 로그인 화면에서 오래 머문 사용자도 콜백에서 쿠키를 잃지 않게 한다.
 */
const OAUTH_LOGIN_COOKIE_MAX_AGE = 60 * 15;

interface OAuthAuthorizeRedirectOptions {
  oauthBaseUrl: string;
  clientId: string;
  redirectUri: string;
  /** 로그인을 마친 뒤 돌아갈 경로. state에 nonce와 함께 담긴다. */
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
  const { nonce, state } = createOAuthState(returnPath);

  const authorizeUrl = new URL(`${oauthBaseUrl}/v1/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_LOGIN_COOKIE_MAX_AGE,
  } as const;
  response.cookies.set(COOKIE_KEYS.CODE_VERIFIER, codeVerifier, cookieOptions);
  response.cookies.set(COOKIE_KEYS.OAUTH_STATE, nonce, cookieOptions);

  return response;
};
