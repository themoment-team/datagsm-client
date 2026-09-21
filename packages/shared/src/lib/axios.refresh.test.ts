import { HttpResponse, apiError, apiPath, apiSuccess, delay, http, server } from '@repo/test-utils';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OAUTH_BASE_URL = 'https://oauth.test';
const TOKEN_URL = `${OAUTH_BASE_URL}/v1/oauth/token`;

const loadAxios = async () => {
  vi.resetModules();
  return import('./axios');
};

const readCookie = (name: string) =>
  document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1] ?? null;

const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

/** accessToken이 access-new일 때만 성공하는 보호된 API */
const protectedApi = (path: string) =>
  http.get(apiPath(path), ({ request }) =>
    request.headers.get('Authorization') === 'Bearer access-new'
      ? apiSuccess(path)
      : apiError(401, '토큰이 만료되었습니다.'),
  );

/**
 * 현재 코드는 oauthAxiosInstance가 본문을 푼 뒤 한 번 더 `.data`를 읽는다.
 * 그래서 `{ data: { access_token, refresh_token } }` 형태여야 갱신에 성공한다.
 * 문서 형식(최상위 access_token)과의 차이는 아래 '알려진 문제' 테스트에 기록한다. 수정 이슈: #218
 */
const tokenResponse = (body: object, init?: { delayMs?: number }) =>
  http.post(TOKEN_URL, async ({ request }) => {
    tokenRequests.push(await request.json());
    if (init?.delayMs) await delay(init.delayMs);
    return HttpResponse.json(body);
  });

let tokenRequests: unknown[] = [];

describe('401 응답 시 토큰 갱신', () => {
  beforeEach(() => {
    tokenRequests = [];
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'client-1');
    vi.stubGlobal('location', { href: 'http://localhost:3000/students' });
    document.cookie = 'accessToken=access-old; Path=/';
    document.cookie = 'refreshToken=refresh-old; Path=/';
  });

  afterEach(clearCookies);

  it('refresh token으로 새 토큰을 받아 쿠키를 바꾸고 원래 요청을 다시 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      protectedApi('/v1/students'),
      tokenResponse({ data: { access_token: 'access-new', refresh_token: 'refresh-new' } }),
    );

    await expect(axiosInstance.get('/v1/students')).resolves.toMatchObject({
      data: '/v1/students',
    });

    expect(tokenRequests).toEqual([
      { grant_type: 'refresh_token', refresh_token: 'refresh-old', client_id: 'client-1' },
    ]);
    expect(readCookie('accessToken')).toBe('access-new');
    expect(readCookie('refreshToken')).toBe('refresh-new');
  });

  it('동시에 401을 받은 요청들은 갱신을 한 번만 하고 모두 새 토큰으로 다시 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      protectedApi('/v1/students'),
      protectedApi('/v1/clubs'),
      protectedApi('/v1/projects'),
      tokenResponse(
        { data: { access_token: 'access-new', refresh_token: 'refresh-new' } },
        { delayMs: 50 },
      ),
    );

    const results = await Promise.all([
      axiosInstance.get('/v1/students'),
      axiosInstance.get('/v1/clubs'),
      axiosInstance.get('/v1/projects'),
    ]);

    expect(tokenRequests).toHaveLength(1);
    expect(results.map((result) => (result as unknown as { data: string }).data)).toEqual([
      '/v1/students',
      '/v1/clubs',
      '/v1/projects',
    ]);
  });

  it('refresh token이 없으면 갱신하지 않고 쿠키를 지운 뒤 /로 보낸다', async () => {
    document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const { axiosInstance } = await loadAxios();
    server.use(protectedApi('/v1/students'), tokenResponse({}));

    await expect(axiosInstance.get('/v1/students')).rejects.toThrow('No refresh token');

    expect(tokenRequests).toHaveLength(0);
    expect(readCookie('accessToken')).toBeNull();
    expect(window.location.href).toBe('/');
  });

  it('갱신 요청이 실패하면 쿠키를 지우고 /로 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      protectedApi('/v1/students'),
      http.post(TOKEN_URL, () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })),
    );

    const error = await axiosInstance.get('/v1/students').catch((e: unknown) => e);

    expect((error as AxiosError).response?.status).toBe(400);
    expect(readCookie('accessToken')).toBeNull();
    expect(readCookie('refreshToken')).toBeNull();
    expect(window.location.href).toBe('/');
  });

  it('갱신 응답에 access_token이 없으면 쿠키를 지우고 /로 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(protectedApi('/v1/students'), tokenResponse({ data: {} }));

    await expect(axiosInstance.get('/v1/students')).rejects.toThrow('No new token returned');

    expect(readCookie('accessToken')).toBeNull();
    expect(window.location.href).toBe('/');
  });

  it('skipAuthRefresh 요청은 401이어도 갱신하지 않는다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(protectedApi('/v1/accounts'), tokenResponse({}));

    const error = await axiosInstance
      .post('/v1/accounts', {}, { skipAuthRefresh: true } as never)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect(tokenRequests).toHaveLength(0);
    expect(readCookie('accessToken')).toBe('access-old');
  });

  it('갱신 후 다시 보낸 요청도 401이면 또 갱신하지 않고 reject한다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      http.get(apiPath('/v1/students'), () => apiError(401, '권한 없음')),
      tokenResponse({ data: { access_token: 'access-new', refresh_token: 'refresh-new' } }),
    );

    const error = await axiosInstance.get('/v1/students').catch((e: unknown) => e);

    expect((error as AxiosError).response?.status).toBe(401);
    expect(tokenRequests).toHaveLength(1);
  });

  it.fails(
    '문서 형식({ access_token, refresh_token })으로 응답해도 갱신에 성공한다 (알려진 문제)',
    async () => {
      const { axiosInstance } = await loadAxios();
      server.use(
        protectedApi('/v1/students'),
        tokenResponse({
          access_token: 'access-new',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'refresh-new',
        }),
      );

      await expect(axiosInstance.get('/v1/students')).resolves.toMatchObject({
        data: '/v1/students',
      });
    },
  );
});
