// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTokenRefreshHandler } from './tokenRefresh';

const OAUTH_BASE_URL = 'https://oauth.test';
const TOKEN_URL = `${OAUTH_BASE_URL}/v1/oauth/token`;
const ORIGIN = 'http://localhost:3000';

const refresh = (
  POST: ReturnType<typeof createTokenRefreshHandler>,
  cookies: Record<string, string> = { refreshToken: 'refresh-old' },
) => {
  const request = new NextRequest(`${ORIGIN}/api/refresh`, { method: 'POST' });
  Object.entries(cookies).forEach(([name, value]) => request.cookies.set(name, value));
  return POST(request);
};

const mockToken = (
  respond: () => Response = () =>
    HttpResponse.json({ access_token: 'access-new', refresh_token: 'refresh-new' }),
) => {
  const bodies: unknown[] = [];
  server.use(
    http.post(TOKEN_URL, async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return bodies;
};

/** 삭제된 쿠키는 빈 값과 과거 만료일로 내려간다. */
const expectCleared = (response: Response & { cookies: { get: (name: string) => unknown } }) => {
  ['accessToken', 'refreshToken', 'loggedIn'].forEach((name) => {
    expect(response.cookies.get(name)).toMatchObject({ value: '', expires: new Date(0) });
  });
};

describe('createTokenRefreshHandler', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'client-app');
  });

  describe('시크릿 없이 갱신하는 클라이언트', () => {
    const POST = createTokenRefreshHandler();

    it('refresh token 쿠키로 새 토큰을 받아 httpOnly 쿠키를 기존과 같은 수명으로 바꾼다', async () => {
      const bodies = mockToken();

      const response = await refresh(POST);

      expect(bodies).toEqual([
        { grant_type: 'refresh_token', refresh_token: 'refresh-old', client_id: 'client-app' },
      ]);
      expect(response.status).toBe(204);
      expect(response.cookies.get('accessToken')).toMatchObject({
        value: 'access-new',
        maxAge: 3600,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(response.cookies.get('refreshToken')).toMatchObject({
        value: 'refresh-new',
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(response.cookies.get('loggedIn')).toMatchObject({
        value: '1',
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: false,
      });
    });

    it('production에서만 토큰 쿠키에 secure를 켠다', async () => {
      mockToken();
      expect((await refresh(POST)).cookies.get('accessToken')?.secure).toBe(false);

      vi.stubEnv('NODE_ENV', 'production');
      mockToken();
      expect((await refresh(POST)).cookies.get('accessToken')?.secure).toBe(true);
    });

    it('갱신 응답의 refresh_token이 null이면 refresh token 쿠키는 건드리지 않는다', async () => {
      mockToken(() => HttpResponse.json({ access_token: 'access-new', refresh_token: null }));

      const response = await refresh(POST);

      expect(response.status).toBe(204);
      expect(response.cookies.get('accessToken')?.value).toBe('access-new');
      expect(response.cookies.get('refreshToken')).toBeUndefined();
      expect(response.cookies.get('loggedIn')).toBeUndefined();
    });

    it('refresh token 쿠키가 없으면 갱신하지 않고 쿠키를 지운 뒤 401로 응답한다', async () => {
      const bodies = mockToken();

      const response = await refresh(POST, {});

      expect(bodies).toEqual([]);
      expect(response.status).toBe(401);
      expectCleared(response);
    });

    it.each(['NEXT_PUBLIC_OAUTH_BASE_URL', 'NEXT_PUBLIC_DATAGSM_CLIENT_ID'])(
      '%s가 없으면 갱신하지 않고 401로 응답한다',
      async (key) => {
        vi.stubEnv(key, '');
        const bodies = mockToken();

        const response = await refresh(POST);

        expect(bodies).toEqual([]);
        expect(response.status).toBe(401);
      },
    );

    it.each([
      ['갱신이 실패하면', () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })],
      ['access_token이 없으면', () => HttpResponse.json({ refresh_token: 'refresh-new' })],
      ['응답이 JSON이 아니면', () => new HttpResponse('oops', { status: 200 })],
      ['서버에 연결하지 못하면', () => HttpResponse.error()],
    ])('%s 쿠키를 지우고 401로 응답한다', async (_, respond) => {
      mockToken(respond);

      const response = await refresh(POST);

      expect(response.status).toBe(401);
      expectCleared(response);
    });
  });

  describe('시크릿을 함께 보내는 클라이언트', () => {
    it('갱신 요청에 client_secret을 함께 보낸다', async () => {
      const bodies = mockToken();
      const POST = createTokenRefreshHandler({ getClientSecret: () => 'client-secret' });

      const response = await refresh(POST);

      expect(bodies).toEqual([
        {
          grant_type: 'refresh_token',
          refresh_token: 'refresh-old',
          client_id: 'client-app',
          client_secret: 'client-secret',
        },
      ]);
      expect(response.status).toBe(204);
    });

    it('시크릿이 비어 있으면 갱신하지 않는다', async () => {
      const bodies = mockToken();
      const POST = createTokenRefreshHandler({ getClientSecret: () => undefined });

      const response = await refresh(POST);

      expect(bodies).toEqual([]);
      expect(response.status).toBe(401);
    });
  });
});
