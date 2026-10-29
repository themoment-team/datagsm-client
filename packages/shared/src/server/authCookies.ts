import { NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';

/** 토큰 응답에 expires_in이 없을 때 쓰는 액세스 토큰 수명. 인가 서버 문서상 1시간이다. */
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30일

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

interface AuthTokens {
  accessToken: string;
  /** 갱신 응답은 refresh_token을 주지 않을 수 있다. 없으면 기존 쿠키를 그대로 둔다. */
  refreshToken?: string | null;
  /** 토큰 응답의 expires_in(초). 쿠키가 실제 토큰보다 오래 남지 않도록 액세스 토큰 쿠키 수명으로 쓴다. */
  expiresIn?: number;
}

/**
 * 토큰을 자바스크립트에서 읽을 수 없는 httpOnly 쿠키로 심는다.
 * 로그인 여부 표시 쿠키는 refresh token과 같은 수명으로 둬서, 액세스 토큰만 만료된 동안에도 로그인으로 본다.
 */
export const setAuthCookies = (
  response: NextResponse,
  { accessToken, refreshToken, expiresIn }: AuthTokens,
) => {
  response.cookies.set(COOKIE_KEYS.ACCESS_TOKEN, accessToken, {
    ...baseCookieOptions(),
    maxAge: expiresIn && expiresIn > 0 ? expiresIn : DEFAULT_ACCESS_TOKEN_MAX_AGE,
  });

  if (refreshToken) {
    response.cookies.set(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, {
      ...baseCookieOptions(),
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
    response.cookies.set(COOKIE_KEYS.LOGGED_IN, '1', {
      ...baseCookieOptions(),
      httpOnly: false,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
};

/** httpOnly 쿠키는 브라우저에서 지울 수 없으므로 서버 응답으로 지운다. */
export const clearAuthCookies = (response: NextResponse) => {
  response.cookies.delete(COOKIE_KEYS.ACCESS_TOKEN);
  response.cookies.delete(COOKIE_KEYS.REFRESH_TOKEN);
  response.cookies.delete(COOKIE_KEYS.LOGGED_IN);
};
