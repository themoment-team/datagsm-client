export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  /** PKCE code_verifier. 인가를 시작할 때 심고 콜백의 토큰 교환에 쓴다. */
  CODE_VERIFIER: 'code_verifier',
  /** 인가 요청 state의 nonce. 콜백에서 대조해 로그인 CSRF를 막는다. */
  OAUTH_STATE: 'oauth_state',
  /** 토큰 쿠키는 httpOnly라 자바스크립트에서 읽을 수 없으므로, 로그인 여부만 알리는 표시 쿠키를 따로 둔다. */
  LOGGED_IN: 'loggedIn',
} as const;
