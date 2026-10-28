// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// 갱신 규칙은 @repo/shared/server의 createTokenRefreshHandler 테스트에서 검증하고,
// 여기서는 이 앱의 설정으로 연결됐는지만 확인한다.
const OAUTH_BASE_URL = 'https://oauth.test';
const TOKEN_URL = `${OAUTH_BASE_URL}/v1/oauth/token`;

const refresh = () => {
  const request = new NextRequest('http://localhost:3001/api/refresh', { method: 'POST' });
  request.cookies.set('refreshToken', 'refresh-old');
  return POST(request);
};

const mockToken = () => {
  const bodies: unknown[] = [];
  server.use(
    http.post(TOKEN_URL, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ access_token: 'access-new', refresh_token: 'refresh-new' });
    }),
  );
  return bodies;
};

describe('POST /api/refresh (admin)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'admin-client');
    vi.stubEnv('DATAGSM_CLIENT_SECRET', 'admin-secret');
  });

  it('client_secret을 함께 보내 토큰을 갱신하고 쿠키를 바꾼다', async () => {
    const bodies = mockToken();

    const response = await refresh();

    expect(bodies).toEqual([
      {
        grant_type: 'refresh_token',
        refresh_token: 'refresh-old',
        client_id: 'admin-client',
        client_secret: 'admin-secret',
      },
    ]);
    expect(response.status).toBe(204);
    expect(response.cookies.get('accessToken')?.value).toBe('access-new');
    expect(response.cookies.get('refreshToken')?.value).toBe('refresh-new');
  });

  it('client_secret 환경 변수가 없으면 갱신을 시도하지 않는다', async () => {
    vi.stubEnv('DATAGSM_CLIENT_SECRET', '');
    const bodies = mockToken();

    const response = await refresh();

    expect(response.status).toBe(401);
    expect(bodies).toEqual([]);
  });
});
