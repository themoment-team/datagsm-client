import { generateRandomToken } from './pkce';

/**
 * OAuth 인가 요청의 state를 `nonce.돌아갈경로` 형태로 만든다.
 * nonce는 httpOnly 쿠키에도 남겨, 콜백이 이 브라우저가 시작한 로그인인지 대조하게 한다(로그인 CSRF 방지).
 */
export const createOAuthState = (returnPath: string) => {
  const nonce = generateRandomToken();
  return { nonce, state: `${nonce}.${returnPath}` };
};

/**
 * state의 nonce가 쿠키에 남긴 nonce와 같으면 돌아갈 경로를, 아니면 null을 돌려준다.
 * nonce는 base64url이라 `.`이 없으므로 첫 `.`에서 나눈다. 경로가 안전한지는 호출하는 쪽에서 검증한다.
 */
export const parseOAuthState = (
  state: string | null | undefined,
  nonce: string | null | undefined,
): string | null => {
  if (!state || !nonce) return null;

  const separator = state.indexOf('.');
  if (separator === -1 || state.slice(0, separator) !== nonce) return null;

  return state.slice(separator + 1);
};
