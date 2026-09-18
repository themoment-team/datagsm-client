// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const OAUTH_BASE_URL = 'https://oauth.test';
const TOKEN_URL = `${OAUTH_BASE_URL}/v1/oauth/token`;
const ORIGIN = 'http://localhost:3001';

const callback = (query: string, codeVerifier = 'verifier-1') => {
  const request = new NextRequest(`${ORIGIN}/api/callback?${query}`);
  request.cookies.set('code_verifier', codeVerifier);
  return GET(request);
};

const mockToken = (
  respond: () => Response = () =>
    HttpResponse.json({ access_token: 'access-1', refresh_token: 'refresh-1' }),
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

describe('GET /api/callback (admin)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'admin-client');
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_SECRET', 'admin-secret');
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_REDIRECT_URI', `${ORIGIN}/api/callback`);
  });

  it('code와 verifier로 토큰을 교환하고 쿠키를 심은 뒤 state 경로로 보낸다', async () => {
    const bodies = mockToken();

    const response = await callback('code=code-1&state=/students');

    expect(bodies).toEqual([
      {
        grant_type: 'authorization_code',
        code: 'code-1',
        client_id: 'admin-client',
        client_secret: 'admin-secret',
        redirect_uri: `${ORIGIN}/api/callback`,
        code_verifier: 'verifier-1',
      },
    ]);
    expect(response.headers.get('location')).toBe(`${ORIGIN}/students`);
    expect(response.cookies.get('accessToken')).toMatchObject({ value: 'access-1', maxAge: 3600 });
    expect(response.cookies.get('refreshToken')).toMatchObject({
      value: 'refresh-1',
      maxAge: 60 * 60 * 24 * 30,
    });
    expect(response.cookies.get('code_verifier')?.value).toBe('');
  });

  it.each([
    ['state가 없으면', 'code=code-1'],
    ['state가 다른 호스트면', `code=code-1&state=${encodeURIComponent('//evil.com')}`],
    ['state가 절대 URL이면', `code=code-1&state=${encodeURIComponent('https://evil.com')}`],
  ])('%s /로 보낸다', async (_, query) => {
    mockToken();

    const response = await callback(query);

    expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
  });

  // isValidRelativePath가 \를 거르지 않아, URL 파서가 //evil.com으로 읽는다.
  it.fails('state가 /\\evil.com이면 다른 호스트로 보내지 않는다 (알려진 문제)', async () => {
    mockToken();

    const response = await callback(`code=code-1&state=${encodeURIComponent('/\\evil.com')}`);

    expect(new URL(response.headers.get('location')!).host).toBe('localhost:3001');
  });

  describe('토큰 없이 /로 돌려보내는 경우', () => {
    it('code가 없으면 교환을 시도하지 않는다', async () => {
      const bodies = mockToken();

      const response = await callback('state=/students');

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
      expect(bodies).toEqual([]);
    });

    it('OAuth 설정 환경 변수가 하나라도 없으면 교환을 시도하지 않는다', async () => {
      vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_SECRET', '');
      const bodies = mockToken();

      const response = await callback('code=code-1');

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
      expect(bodies).toEqual([]);
    });

    it.each([
      ['교환이 실패하면', () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })],
      ['refresh_token이 없으면', () => HttpResponse.json({ access_token: 'access-1' })],
      ['응답이 JSON이 아니면', () => new HttpResponse('oops', { status: 200 })],
      ['서버에 연결하지 못하면', () => HttpResponse.error()],
    ])('%s 쿠키를 심지 않는다', async (_, respond) => {
      mockToken(respond);

      const response = await callback('code=code-1&state=/students');

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
      expect(response.cookies.get('accessToken')).toBeUndefined();
    });
  });
});
