'use client';

import { COOKIE_KEYS } from '@repo/shared/constants';
import { getCookie } from '@repo/shared/utils';

/** 클라이언트에서 로그인 여부를 확인한다 (accessToken 쿠키 존재 여부). */
export const getIsAuthenticated = (): boolean => {
  return Boolean(getCookie(COOKIE_KEYS.ACCESS_TOKEN));
};

/**
 * 로그인 시작. 서버 라우트(`/api/login`)로 이동해 PKCE 흐름을 시작한다.
 * 로그인 완료 후 `returnTo`(기본: 현재 경로)로 복귀한다.
 */
export const startLogin = (returnTo?: string): void => {
  if (typeof window === 'undefined') return;

  const target = returnTo ?? `${window.location.pathname}${window.location.search}`;
  window.location.href = `/api/login?returnTo=${encodeURIComponent(target)}`;
};

/**
 * 로그인이 필요한 액션 실행 헬퍼.
 * 로그인 상태면 `action`을 실행하고, 아니면 로그인 흐름으로 유도한다.
 */
export const requireAuth = (action: () => void, returnTo?: string): void => {
  if (getIsAuthenticated()) {
    action();
    return;
  }

  startLogin(returnTo);
};
