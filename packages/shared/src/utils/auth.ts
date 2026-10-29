import { COOKIE_KEYS } from '@repo/shared/constants';

import { getCookie } from './cookies';

/**
 * 클라이언트에서 로그인 여부를 확인한다. 토큰 쿠키는 httpOnly라 읽을 수 없으므로 표시 쿠키로 판단한다.
 * 표시 쿠키는 refresh token과 수명이 같아서, 액세스 토큰만 만료된 동안에도 로그인으로 본다.
 */
export const getIsAuthenticated = (): boolean => Boolean(getCookie(COOKIE_KEYS.LOGGED_IN));
