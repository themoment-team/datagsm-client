// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const OAUTH_BASE_URL = 'https://oauth.test';
const UPSTREAM_URL = `${OAUTH_BASE_URL}/v1/oauth/authorize`;

const postRequest = (body: unknown) =>
  new NextRequest('http://localhost:3004/api/oauth/authorize', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/oauth/authorize', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
  });

  it('요청 본문을 OAuth 서버로 그대로 보낸다', async () => {
    let received: unknown;
    server.use(
      http.post(UPSTREAM_URL, async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, {
          status: 302,
          headers: { Location: 'https://app.test/cb?code=1' },
        });
      }),
    );

    await POST(postRequest({ email: 'a@gsm.hs.kr', password: 'pw', token: 't' }));

    expect(received).toEqual({ email: 'a@gsm.hs.kr', password: 'pw', token: 't' });
  });

  it('서버가 302로 응답하면 따라가지 않고 Location을 redirect_url로 돌려준다', async () => {
    server.use(
      http.post(
        UPSTREAM_URL,
        () =>
          new HttpResponse(null, {
            status: 302,
            headers: { Location: 'https://app.test/cb?code=1' },
          }),
      ),
    );

    const response = await POST(postRequest({}));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ redirect_url: 'https://app.test/cb?code=1' });
  });

  it('302인데 Location이 없으면 500 invalid_response를 돌려준다', async () => {
    server.use(http.post(UPSTREAM_URL, () => new HttpResponse(null, { status: 302 })));

    const response = await POST(postRequest({}));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'invalid_response' });
  });

  it('서버 실패는 상태 코드와 본문을 그대로 넘긴다', async () => {
    server.use(
      http.post(UPSTREAM_URL, () =>
        HttpResponse.json({ code: 422, message: '정보 수정이 필요합니다.' }, { status: 422 }),
      ),
    );

    const response = await POST(postRequest({}));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: 422,
      message: '정보 수정이 필요합니다.',
    });
  });

  it('리다이렉트 없이 성공하면 success를 돌려준다', async () => {
    server.use(http.post(UPSTREAM_URL, () => HttpResponse.json({})));

    await expect((await POST(postRequest({}))).json()).resolves.toEqual({ success: true });
  });

  it('OAuth 서버 URL 환경 변수가 없으면 요청하지 않고 500을 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', '');

    const response = await POST(postRequest({}));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'server_error' });
  });

  it('요청 본문이 JSON이 아니면 500 server_error를 돌려준다', async () => {
    const response = await POST(postRequest('not-json'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'server_error' });
  });

  it('서버에 연결하지 못하면 500 server_error를 돌려준다', async () => {
    server.use(http.post(UPSTREAM_URL, () => HttpResponse.error()));

    const response = await POST(postRequest({}));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'server_error' });
  });
});
