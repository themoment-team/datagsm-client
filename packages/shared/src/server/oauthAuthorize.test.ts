// @vitest-environment node
import { generateCodeChallenge, parseOAuthState } from '@repo/shared/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createOAuthAuthorizeRedirect } from './oauthAuthorize';

const OAUTH_BASE_URL = 'https://oauth.test';

const startLogin = () =>
  createOAuthAuthorizeRedirect({
    oauthBaseUrl: OAUTH_BASE_URL,
    clientId: 'client-app',
    redirectUri: 'http://localhost:3000/api/callback',
    returnPath: '/students',
  });

describe('createOAuthAuthorizeRedirect', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
  });

  it('PKCE 파라미터와 nonce를 담은 state로 OAuth 인가 페이지에 보낸다', async () => {
    const response = await startLogin();

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.origin + location.pathname).toBe(`${OAUTH_BASE_URL}/v1/oauth/authorize`);
    expect(Object.fromEntries(location.searchParams)).toEqual({
      client_id: 'client-app',
      redirect_uri: 'http://localhost:3000/api/callback',
      response_type: 'code',
      state: expect.stringMatching(/^[A-Za-z0-9_-]{43}\.\/students$/),
      code_challenge: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      code_challenge_method: 'S256',
    });
  });

  it('콜백이 대조할 state nonce를 15분짜리 httpOnly 쿠키로 남긴다', async () => {
    const response = await startLogin();

    const cookie = response.cookies.get('oauth_state');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900 });
    const state = new URL(response.headers.get('location')!).searchParams.get('state');
    expect(parseOAuthState(state, cookie!.value)).toBe('/students');
  });

  it('challenge를 만든 verifier를 15분짜리 httpOnly 쿠키로 남긴다', async () => {
    const response = await startLogin();

    const cookie = response.cookies.get('code_verifier');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900 });
    const challenge = new URL(response.headers.get('location')!).searchParams.get('code_challenge');
    await expect(generateCodeChallenge(cookie!.value)).resolves.toBe(challenge);
  });

  it.each([
    ['다른 호스트면', '//evil.com'],
    ['절대 URL이면', 'https://evil.com'],
    ['/\\evil.com이면', '/\\evil.com'],
    ['상대 경로가 아니면', 'students'],
  ])('돌아갈 경로가 %s state에 /를 담는다', async (_, returnPath) => {
    const response = await createOAuthAuthorizeRedirect({
      oauthBaseUrl: OAUTH_BASE_URL,
      clientId: 'client-app',
      redirectUri: 'http://localhost:3000/api/callback',
      returnPath,
    });

    const state = new URL(response.headers.get('location')!).searchParams.get('state');
    expect(parseOAuthState(state, response.cookies.get('oauth_state')?.value)).toBe('/');
  });

  it('개발 환경에서는 접두사 없이 secure를 끈 쿠키로 남긴다', async () => {
    const response = await startLogin();

    expect(response.cookies.get('code_verifier')?.secure).toBe(false);
    expect(response.cookies.get('oauth_state')?.secure).toBe(false);
  });

  it('production에서는 다른 서브도메인이 심을 수 없도록 __Host- 접두사를 붙인 secure 쿠키로 남긴다', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const response = await startLogin();

    ['__Host-code_verifier', '__Host-oauth_state'].forEach((name) => {
      // __Host- 쿠키는 Secure·Path=/·Domain 없음이어야 브라우저가 받는다.
      expect(response.cookies.get(name)).toMatchObject({ secure: true, path: '/', maxAge: 900 });
      expect(response.cookies.get(name)?.domain).toBeUndefined();
    });
    expect(response.cookies.get('code_verifier')).toBeUndefined();
    expect(response.cookies.get('oauth_state')).toBeUndefined();
  });
});
