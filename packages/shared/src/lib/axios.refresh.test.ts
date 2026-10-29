import { HttpResponse, apiError, apiPath, apiSuccess, delay, http, server } from '@repo/test-utils';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadAxios = async () => {
  vi.resetModules();
  return import('./axios');
};

/**
 * 토큰은 httpOnly 쿠키라 jsdom에서 서버 라우트가 심는 쿠키를 흉내 낼 수 없다.
 * 대신 `/api/refresh`가 성공하면 보호된 API가 통과하도록 상태를 공유한다.
 */
let isRefreshed = false;
let refreshCount = 0;

const protectedApi = (path: string) =>
  http.get(apiPath(path), () =>
    isRefreshed ? apiSuccess(path) : apiError(401, '토큰이 만료되었습니다.'),
  );

const refreshRoute = (respond: () => Response = () => new HttpResponse(null, { status: 204 })) =>
  http.post(apiPath('/refresh'), async () => {
    refreshCount += 1;
    const response = respond();
    if (response.status === 204) {
      await delay(50);
      isRefreshed = true;
    }
    return response;
  });

describe('401 응답 시 토큰 갱신', () => {
  beforeEach(() => {
    isRefreshed = false;
    refreshCount = 0;
    vi.stubGlobal('location', { href: 'http://localhost:3000/students' });
  });

  it('서버 라우트(/api/refresh)로 토큰을 갱신한 뒤 원래 요청을 다시 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(protectedApi('/v1/students'), refreshRoute());

    await expect(axiosInstance.get('/v1/students')).resolves.toMatchObject({
      data: '/v1/students',
    });

    expect(refreshCount).toBe(1);
  });

  it('OAuth 서버에 직접 갱신을 요청하지 않는다', async () => {
    const { axiosInstance } = await loadAxios();
    const oauthTokenRequest = vi.fn();
    server.use(
      protectedApi('/v1/students'),
      refreshRoute(),
      http.post('*/v1/oauth/token', () => {
        oauthTokenRequest();
        return HttpResponse.json({});
      }),
    );

    await axiosInstance.get('/v1/students');

    expect(oauthTokenRequest).not.toHaveBeenCalled();
  });

  it('동시에 401을 받은 요청들은 갱신을 한 번만 하고 모두 다시 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      protectedApi('/v1/students'),
      protectedApi('/v1/clubs'),
      protectedApi('/v1/projects'),
      refreshRoute(),
    );

    const results = await Promise.all([
      axiosInstance.get('/v1/students'),
      axiosInstance.get('/v1/clubs'),
      axiosInstance.get('/v1/projects'),
    ]);

    expect(refreshCount).toBe(1);
    expect(results.map((result) => (result as unknown as { data: string }).data)).toEqual([
      '/v1/students',
      '/v1/clubs',
      '/v1/projects',
    ]);
  });

  it('갱신이 실패하면 /로 보낸다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      protectedApi('/v1/students'),
      refreshRoute(() => HttpResponse.json({ error: 'invalid_grant' }, { status: 401 })),
    );

    const error = await axiosInstance.get('/v1/students').catch((e: unknown) => e);

    expect((error as AxiosError).response?.status).toBe(401);
    expect(refreshCount).toBe(1);
    expect(window.location.href).toBe('/');
  });

  it('갱신이 실패하면 갱신을 기다리던 요청도 모두 실패하고, 다음 갱신 때 다시 나가지 않는다', async () => {
    const { axiosInstance } = await loadAxios();
    let studentsRequestCount = 0;
    server.use(
      http.get(apiPath('/v1/students'), () => {
        studentsRequestCount += 1;
        return isRefreshed ? apiSuccess('/v1/students') : apiError(401, '토큰이 만료되었습니다.');
      }),
      protectedApi('/v1/clubs'),
      protectedApi('/v1/projects'),
      http.post(apiPath('/refresh'), async () => {
        refreshCount += 1;
        await delay(50);
        return HttpResponse.json({ error: 'invalid_grant' }, { status: 401 });
      }),
    );

    const results = await Promise.allSettled([
      axiosInstance.get('/v1/clubs'),
      axiosInstance.get('/v1/students'),
    ]);

    expect(results.map(({ status }) => status)).toEqual(['rejected', 'rejected']);
    expect(refreshCount).toBe(1);

    // 갱신 실패로 바뀐 location을 되돌려야 상대 경로 요청을 보낼 수 있다.
    vi.stubGlobal('location', { href: 'http://localhost:3000/students' });
    server.use(refreshRoute());
    await axiosInstance.get('/v1/projects');

    // 실패한 갱신을 기다리던 /v1/students가 큐에 남아 있었다면 여기서 다시 나간다.
    expect(studentsRequestCount).toBe(1);
  });

  it('skipAuthRefresh 요청은 401이어도 갱신하지 않는다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(protectedApi('/v1/accounts'), refreshRoute());

    const error = await axiosInstance
      .post('/v1/accounts', {}, { skipAuthRefresh: true } as never)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect(refreshCount).toBe(0);
  });

  it('갱신 후 다시 보낸 요청도 401이면 또 갱신하지 않고 reject한다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(
      http.get(apiPath('/v1/students'), () => apiError(401, '권한 없음')),
      refreshRoute(),
    );

    const error = await axiosInstance.get('/v1/students').catch((e: unknown) => e);

    expect((error as AxiosError).response?.status).toBe(401);
    expect(refreshCount).toBe(1);
  });
});
