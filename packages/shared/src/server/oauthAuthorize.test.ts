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

  it('production에서만 쿠키에 secure를 켠다', async () => {
    const response = await startLogin();
    expect(response.cookies.get('code_verifier')?.secure).toBe(false);
    expect(response.cookies.get('oauth_state')?.secure).toBe(false);

    vi.stubEnv('NODE_ENV', 'production');
    const productionResponse = await startLogin();
    expect(productionResponse.cookies.get('code_verifier')?.secure).toBe(true);
    expect(productionResponse.cookies.get('oauth_state')?.secure).toBe(true);
  });
});
