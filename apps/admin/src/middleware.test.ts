// @vitest-environment node
import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config, middleware } from './middleware';

const OAUTH_BASE_URL = 'https://oauth.test';

const requestTo = (path: string, cookies: Record<string, string> = {}) => {
  const request = new NextRequest(new URL(path, 'http://localhost:3001'));
  Object.entries(cookies).forEach(([name, value]) => request.cookies.set(name, value));
  return request;
};

describe('admin middleware', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'admin-client');
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_REDIRECT_URI', 'http://localhost:3001/api/callback');
  });

  describe('accessToken이 없을 때', () => {
    it('PKCE 파라미터와 원래 경로를 담아 OAuth 인가 페이지로 보낸다', async () => {
      const response = await middleware(requestTo('/students'));

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location')!);
      expect(location.origin + location.pathname).toBe(`${OAUTH_BASE_URL}/v1/oauth/authorize`);
      expect(Object.fromEntries(location.searchParams)).toEqual({
        client_id: 'admin-client',
        redirect_uri: 'http://localhost:3001/api/callback',
        response_type: 'code',
        state: '/students',
        code_challenge: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        code_challenge_method: 'S256',
      });
    });

    it('state에는 쿼리를 빼고 경로만 담는다', async () => {
      const response = await middleware(requestTo('/students?grade=2'));

      expect(new URL(response.headers.get('location')!).searchParams.get('state')).toBe(
        '/students',
      );
    });

    it('challenge를 만든 verifier를 10분짜리 httpOnly 쿠키로 남긴다', async () => {
      const { generateCodeChallenge } = await import('@repo/shared/utils');

      const response = await middleware(requestTo('/'));

      const cookie = response.cookies.get('code_verifier');
      expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
      const challenge = new URL(response.headers.get('location')!).searchParams.get(
        'code_challenge',
      );
      await expect(generateCodeChallenge(cookie!.value)).resolves.toBe(challenge);
    });

    it('production에서만 verifier 쿠키에 secure를 켠다', async () => {
      expect((await middleware(requestTo('/'))).cookies.get('code_verifier')?.secure).toBe(false);

      vi.stubEnv('NODE_ENV', 'production');
      expect((await middleware(requestTo('/'))).cookies.get('code_verifier')?.secure).toBe(true);
    });

    it.each([
      ['NEXT_PUBLIC_OAUTH_BASE_URL'],
      ['NEXT_PUBLIC_DATAGSM_CLIENT_ID'],
      ['NEXT_PUBLIC_DATAGSM_REDIRECT_URI'],
    ])('%s가 없으면 설정 오류를 던진다', async (name) => {
      vi.stubEnv(name, '');

      await expect(middleware(requestTo('/students'))).rejects.toThrow(name);
    });
  });

  it('accessToken이 있으면 그대로 통과시킨다', async () => {
    const response = await middleware(requestTo('/students', { accessToken: 'token' }));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });

  it('/api 경로는 토큰이 없어도 통과시킨다', async () => {
    const response = await middleware(requestTo('/api/callback?code=abc'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  describe('matcher', () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    it.each(['/', '/students', '/clubs/1'])('%s 페이지에는 적용한다', (path) => {
      expect(matcher.test(path)).toBe(true);
    });

    it.each([
      '/api/callback',
      '/_next/static/chunk.js',
      '/_next/image',
      '/favicon.ico',
      '/logo.svg',
    ])('%s에는 적용하지 않는다', (path) => {
      expect(matcher.test(path)).toBe(false);
    });
  });
});
