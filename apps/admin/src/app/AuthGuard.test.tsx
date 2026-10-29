import { COOKIE_KEYS } from '@repo/shared/constants';
import { deleteCookie, setCookie } from '@repo/shared/utils';
import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  createMyAccount,
  expectNoRequest,
  http,
  renderWithProviders,
  screen,
  server,
  setMockPathname,
  waitFor,
} from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AuthGuard from './AuthGuard';

const CURRENT_URL = 'http://localhost:3000/students';

const mockMyAccount = (resolver: () => Response) => {
  server.use(http.get(apiPath('/v1/accounts/my'), resolver));
};

/** oauthAxiosInstance의 baseURL은 모듈을 불러올 때 정해지므로 호스트와 무관하게 매칭한다. */
const mockLogout = (resolver: () => Response = () => new HttpResponse(null, { status: 204 })) => {
  const requests: Request[] = [];
  server.use(
    http.post('*/v1/oauth/logout', ({ request }) => {
      requests.push(request);
      return resolver();
    }),
  );
  return requests;
};

/** 토큰 쿠키는 httpOnly라 브라우저에서 지울 수 없어, 서버 라우트(/api/logout) 요청으로 로컬 로그아웃을 확인한다. */
const mockLocalLogout = () => {
  const requests: Request[] = [];
  server.use(
    http.post(apiPath('/logout'), ({ request }) => {
      requests.push(request);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return requests;
};

const renderGuard = () =>
  renderWithProviders(
    <AuthGuard>
      <p>관리자 화면</p>
    </AuthGuard>,
  );

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { href: CURRENT_URL });
    setCookie(COOKIE_KEYS.LOGGED_IN, '1');
  });

  afterEach(() => {
    vi.useRealTimers();
    deleteCookie(COOKIE_KEYS.LOGGED_IN);
  });

  it('관리자 계정이면 화면을 보여 준다', async () => {
    mockMyAccount(() => apiSuccess(createMyAccount({ role: 'ADMIN' })));

    renderGuard();

    expect(await screen.findByText('관리자 화면')).toBeInTheDocument();
  });

  it('관리자가 아니면 안내 화면을 보여 주고, 저절로 로그아웃하거나 이동하지 않는다', async () => {
    // 예전에는 3초 뒤 로컬 쿠키만 지우고 이동해서, 남은 IdP 세션으로 같은 계정에 다시 로그인되는 일이 반복됐다(#249).
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMyAccount(() => apiSuccess(createMyAccount({ role: 'USER' })));
    const logoutRequests = mockLogout();
    const localLogoutRequests = mockLocalLogout();

    renderGuard();

    expect(await screen.findByRole('heading', { name: '접근 권한 없음' })).toBeInTheDocument();
    expect(screen.queryByText('관리자 화면')).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5_000);

    expect(logoutRequests).toHaveLength(0);
    expect(localLogoutRequests).toHaveLength(0);
    expect(window.location.href).toBe(CURRENT_URL);
  });

  it('관리자가 아닐 때 다른 계정으로 로그인하면 IdP 세션까지 로그아웃하고 /로 보낸다', async () => {
    mockMyAccount(() => apiSuccess(createMyAccount({ role: 'USER' })));
    const logoutRequests = mockLogout();
    const localLogoutRequests = mockLocalLogout();
    const { user } = renderGuard();

    await user.click(await screen.findByRole('button', { name: '다른 계정으로 로그인' }));

    await waitFor(() => expect(window.location.href).toBe('/'));
    expect(logoutRequests).toHaveLength(1);
    expect(logoutRequests[0]?.credentials).toBe('include');
    expect(localLogoutRequests).toHaveLength(1);
  });

  it('IdP 로그아웃이 실패해도 로컬 로그아웃은 진행한다', async () => {
    mockMyAccount(() => apiSuccess(createMyAccount({ role: 'USER' })));
    mockLogout(() => HttpResponse.error());
    const localLogoutRequests = mockLocalLogout();
    const { user } = renderGuard();

    await user.click(await screen.findByRole('button', { name: '다른 계정으로 로그인' }));

    await waitFor(() => expect(window.location.href).toBe('/'));
    expect(localLogoutRequests).toHaveLength(1);
  });

  it('토큰 쿠키를 지우지 못하면 이동하지 않고 실패를 알려 다시 시도할 수 있게 한다', async () => {
    mockMyAccount(() => apiSuccess(createMyAccount({ role: 'USER' })));
    mockLogout();
    server.use(http.post(apiPath('/logout'), () => HttpResponse.error()));
    const { user } = renderGuard();

    await user.click(await screen.findByRole('button', { name: '다른 계정으로 로그인' }));

    expect(
      await screen.findByText('로그아웃에 실패했습니다. 다시 시도해 주세요.'),
    ).toBeInTheDocument();
    expect(window.location.href).toBe(CURRENT_URL);
    expect(screen.getByRole('button', { name: '다른 계정으로 로그인' })).toBeEnabled();
  });

  it('로그인 취소 화면은 로그인하지 않았어도 계정을 조회하지 않고 그대로 보여 준다', async () => {
    // 조회하면 401로 재로그인이 시작돼 /로 이동하고, 미들웨어가 다시 동의 화면으로 보낸다.
    deleteCookie(COOKIE_KEYS.LOGGED_IN);
    setMockPathname('/login/canceled');
    let requestCount = 0;
    mockMyAccount(() => {
      requestCount += 1;
      return apiError(401, '인증이 필요합니다.');
    });

    renderGuard();

    expect(screen.getByText('관리자 화면')).toBeInTheDocument();
    await expectNoRequest(() => requestCount);
    expect(window.location.href).toBe(CURRENT_URL);
  });

  it('계정 조회가 실패하면 쿠키를 지우지 않고 다시 시도할 수 있게 한다', async () => {
    let isServerDown = true;
    const localLogoutRequests = mockLocalLogout();
    mockMyAccount(() =>
      isServerDown
        ? apiError(500, '서버 오류가 발생했습니다.')
        : apiSuccess(createMyAccount({ role: 'ADMIN' })),
    );
    const { user } = renderGuard();

    const retryButton = await screen.findByRole('button', { name: '다시 시도' });

    expect(localLogoutRequests).toHaveLength(0);
    expect(window.location.href).toBe(CURRENT_URL);

    isServerDown = false;
    await user.click(retryButton);

    expect(await screen.findByText('관리자 화면')).toBeInTheDocument();
  });
});
