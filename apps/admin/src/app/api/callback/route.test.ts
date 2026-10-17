// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

// 콜백 처리 규칙은 @repo/shared/server의 createOAuthCallbackHandler 테스트에서 검증하고,
// 여기서는 이 앱의 설정으로 연결됐는지만 확인한다.
const OAUTH_BASE_URL = 'https://oauth.test';
const TOKEN_URL = `${OAUTH_BASE_URL}/v1/oauth/token`;
const ORIGIN = 'http://localhost:3001';

const callback = (query: string) => {
  const request = new NextRequest(`${ORIGIN}/api/callback?${query}`);
  request.cookies.set('code_verifier', 'verifier-1');
  return GET(request);
};

const mockToken = () => {
  const bodies: unknown[] = [];
  server.use(
    http.post(TOKEN_URL, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ access_token: 'access-1', refresh_token: 'refresh-1' });
    }),
  );
  return bodies;
};

describe('GET /api/callback (admin)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'admin-client');
    vi.stubEnv('DATAGSM_CLIENT_SECRET', 'admin-secret');
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_REDIRECT_URI', `${ORIGIN}/api/callback`);
  });

  it('client_secret을 함께 보내 토큰을 교환하고 쿠키를 심은 뒤 state 경로로 보낸다', async () => {
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
    expect(response.cookies.get('accessToken')?.value).toBe('access-1');
    expect(response.cookies.get('refreshToken')?.value).toBe('refresh-1');
  });

  it('client_secret 환경 변수가 없으면 교환을 시도하지 않는다', async () => {
    vi.stubEnv('DATAGSM_CLIENT_SECRET', '');
    const bodies = mockToken();

    const response = await callback('code=code-1');

    expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
    expect(bodies).toEqual([]);
  });
});
