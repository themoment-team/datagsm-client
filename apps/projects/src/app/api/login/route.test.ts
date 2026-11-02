// @vitest-environment node
import { NextRequest } from 'next/server';

import { parseOAuthState } from '@repo/shared/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const OAUTH_BASE_URL = 'https://oauth.test';
const ORIGIN = 'http://localhost:3005';

const login = (query = '') => GET(new NextRequest(`${ORIGIN}/api/login${query}`));

/** state를 쿠키의 nonce와 대조해 콜백이 돌아갈 경로를 꺼낸다. */
const returnPathOf = (
  response: Response & { cookies: { get: (name: string) => { value: string } | undefined } },
) =>
  parseOAuthState(
    new URL(response.headers.get('location')!).searchParams.get('state'),
    response.cookies.get('oauth_state')?.value,
  );

describe('GET /api/login (projects)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'projects-app');
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_REDIRECT_URI', `${ORIGIN}/api/callback`);
  });

  it('PKCE와 state nonce를 담아 OAuth 인가 페이지로 보낸다', async () => {
    const response = await login(`?returnTo=${encodeURIComponent('/me?status=pending')}`);

    const location = new URL(response.headers.get('location')!);
    expect(location.origin + location.pathname).toBe(`${OAUTH_BASE_URL}/v1/oauth/authorize`);
    expect(location.searchParams.get('client_id')).toBe('projects-app');
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');
    expect(response.cookies.get('code_verifier')).toMatchObject({ httpOnly: true, maxAge: 900 });
    expect(response.cookies.get('oauth_state')).toMatchObject({ httpOnly: true, maxAge: 900 });
    expect(returnPathOf(response)).toBe('/me?status=pending');
  });

  it.each([
    ['returnTo가 없으면', ''],
    ['returnTo가 다른 호스트면', `?returnTo=${encodeURIComponent('//evil.com')}`],
  ])('%s 돌아갈 경로를 /로 담는다', async (_, query) => {
    const response = await login(query);

    expect(returnPathOf(response)).toBe('/');
  });

  it('설정이 비어 있으면 인가로 보내지 않고 /로 돌려보낸다', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', '');

    const response = await login();

    expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
    expect(response.cookies.get('oauth_state')).toBeUndefined();
  });
});
