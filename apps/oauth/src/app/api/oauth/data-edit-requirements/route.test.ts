// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const OAUTH_BASE_URL = 'https://oauth.test';
const UPSTREAM_URL = `${OAUTH_BASE_URL}/v1/oauth/authorize/data-edit-requirements`;

const postRequest = (body: unknown) =>
  new NextRequest('http://localhost:3004/api/oauth/data-edit-requirements', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('POST /api/oauth/data-edit-requirements', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
  });

  it('자격증명을 서버로 보내고 필요한 항목 응답을 그대로 돌려준다', async () => {
    let received: unknown;
    server.use(
      http.post(UPSTREAM_URL, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ data: { fields: ['MAJOR_CLUB'] } });
      }),
    );

    const response = await POST(postRequest({ email: 'a@gsm.hs.kr', password: 'pw' }));

    expect(received).toEqual({ email: 'a@gsm.hs.kr', password: 'pw' });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { fields: ['MAJOR_CLUB'] } });
  });

  it('서버 실패의 상태 코드를 그대로 넘긴다', async () => {
    server.use(
      http.post(UPSTREAM_URL, () =>
        HttpResponse.json({ message: '비밀번호 불일치' }, { status: 401 }),
      ),
    );

    const response = await POST(postRequest({}));

    expect(response.status).toBe(401);
  });

  it('OAuth 서버 URL 환경 변수가 없으면 500을 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', '');

    const response = await POST(postRequest({}));

    expect(response.status).toBe(500);
  });
});
