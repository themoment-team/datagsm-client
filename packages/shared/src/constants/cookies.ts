export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  /** 토큰 쿠키는 httpOnly라 자바스크립트에서 읽을 수 없으므로, 로그인 여부만 알리는 표시 쿠키를 따로 둔다. */
  LOGGED_IN: 'loggedIn',
} as const;
