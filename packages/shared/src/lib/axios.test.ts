import { HttpResponse, apiError, apiPath, apiSuccess, http, server } from '@repo/test-utils';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OAUTH_BASE_URL = 'https://oauth.test';

// 인터셉터가 모듈 전역 상태(isRefreshing, refreshQueue)를 가지므로 테스트마다 새로 불러온다.
const loadAxios = async () => {
  vi.resetModules();
  return import('./axios');
};

const setTokenCookies = (tokens: { accessToken?: string; refreshToken?: string }) => {
  Object.entries(tokens).forEach(([name, value]) => {
    document.cookie = `${name}=${value}; Path=/`;
  });
};

const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

describe('axiosInstance 요청·응답 인터셉터', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
  });

  afterEach(clearCookies);

  it('accessToken 쿠키가 있으면 Bearer 헤더를 붙인다', async () => {
    const { axiosInstance } = await loadAxios();
    let authorization: string | null = null;
    server.use(
      http.get(apiPath('/v1/accounts/my'), ({ request }) => {
        authorization = request.headers.get('Authorization');
        return apiSuccess(null);
      }),
    );
    setTokenCookies({ accessToken: 'access-1' });

    await axiosInstance.get('/v1/accounts/my');

    expect(authorization).toBe('Bearer access-1');
  });

  it('accessToken 쿠키가 없으면 Authorization 헤더를 붙이지 않는다', async () => {
    const { axiosInstance } = await loadAxios();
    let hasAuthorization = true;
    server.use(
      http.get(apiPath('/v1/health'), ({ request }) => {
        hasAuthorization = request.headers.has('Authorization');
        return apiSuccess('UP');
      }),
    );

    await axiosInstance.get('/v1/health');

    expect(hasAuthorization).toBe(false);
  });

  it('성공 응답은 AxiosResponse 대신 응답 본문을 돌려준다', async () => {
    const { axiosInstance } = await loadAxios();
    server.use(http.get(apiPath('/v1/clubs'), () => apiSuccess({ clubs: [] })));

    await expect(axiosInstance.get('/v1/clubs')).resolves.toEqual({
      status: 'OK',
      code: 200,
      message: 'OK',
      data: { clubs: [] },
    });
  });

  it('401이 아닌 실패는 토큰 갱신 없이 AxiosError로 reject한다', async () => {
    const { axiosInstance } = await loadAxios();
    const refresh = vi.fn();
    server.use(
      http.get(apiPath('/v1/clubs'), () => apiError(403, '권한이 없습니다.')),
      http.post(`${OAUTH_BASE_URL}/v1/oauth/token`, () => {
        refresh();
        return HttpResponse.json({});
      }),
    );
    setTokenCookies({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    const error = await axiosInstance.get('/v1/clubs').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(403);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('oauthAxiosInstance', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
  });

  it('NEXT_PUBLIC_OAUTH_BASE_URL로 요청하고 응답 본문을 돌려준다', async () => {
    const { oauthAxiosInstance } = await loadAxios();
    server.use(
      http.get(`${OAUTH_BASE_URL}/v1/oauth/sessions/abc`, () => apiSuccess({ serviceName: 'App' })),
    );

    await expect(oauthAxiosInstance.get('/v1/oauth/sessions/abc')).resolves.toMatchObject({
      data: { serviceName: 'App' },
    });
  });

  it('실패는 토큰 갱신 없이 그대로 reject한다', async () => {
    const { oauthAxiosInstance } = await loadAxios();
    server.use(
      http.post(`${OAUTH_BASE_URL}/v1/oauth/code`, () =>
        HttpResponse.json({ error: 'invalid_grant' }, { status: 401 }),
      ),
    );

    const error = await oauthAxiosInstance.post('/v1/oauth/code').catch((e: unknown) => e);

    expect((error as AxiosError).response?.status).toBe(401);
  });
});
