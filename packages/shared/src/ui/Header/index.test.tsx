import { COOKIE_KEYS } from '@repo/shared/constants';
import { deleteCookie, setCookie } from '@repo/shared/utils';
import {
  HttpResponse,
  apiPath,
  http,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '.';

const queryLogoutButtons = () => screen.queryAllByRole('button', { name: 'Logout' });

describe('Header', () => {
  beforeEach(() => {
    deleteCookie(COOKIE_KEYS.LOGGED_IN);
  });

  it('projects에서 로그인했으면 데스크톱과 모바일 메뉴에 로그아웃 버튼을 보여 준다', () => {
    setCookie(COOKIE_KEYS.LOGGED_IN, '1');

    renderWithProviders(<Header role="projects" />);

    expect(queryLogoutButtons()).toHaveLength(2);
  });

  it('projects에서 로그인하지 않았으면 로그아웃 버튼을 보여 주지 않는다', () => {
    renderWithProviders(<Header role="projects" />);

    expect(queryLogoutButtons()).toHaveLength(0);
  });

  it('client는 쿠키와 관계없이 지금처럼 로그아웃 버튼을 보여 준다', () => {
    renderWithProviders(<Header role="client" />);

    expect(queryLogoutButtons()).toHaveLength(2);
  });

  it('로그아웃하면 IdP 세션을 끊고 서버 라우트로 토큰 쿠키를 지운 뒤 /로 보낸다', async () => {
    vi.stubGlobal('location', { href: 'http://localhost:3000/mypage' });
    const requests: string[] = [];
    server.use(
      http.post('*/v1/oauth/logout', () => {
        requests.push('idp');
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(apiPath('/logout'), () => {
        requests.push('local');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<Header role="client" />);

    await user.click(queryLogoutButtons()[0]!);

    await waitFor(() => expect(window.location.href).toBe('/'));
    expect(requests).toEqual(['idp', 'local']);
  });

  it('토큰 쿠키를 지우지 못하면 로그아웃된 것처럼 이동하지 않고 실패를 알린다', async () => {
    vi.stubGlobal('location', { href: 'http://localhost:3000/mypage' });
    server.use(
      http.post('*/v1/oauth/logout', () => new HttpResponse(null, { status: 204 })),
      http.post(apiPath('/logout'), () => HttpResponse.error()),
    );
    const { user } = renderWithProviders(<Header role="client" />);

    await user.click(queryLogoutButtons()[0]!);

    expect(
      await screen.findByText('로그아웃에 실패했습니다. 다시 시도해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('로그아웃 되었습니다.')).not.toBeInTheDocument();
    expect(window.location.href).toBe('http://localhost:3000/mypage');
  });
});
