import { COOKIE_KEYS } from '@repo/shared/constants';
import { deleteCookie, setCookie } from '@repo/shared/utils';
import { renderWithProviders, screen } from '@repo/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import Header from '.';

const queryLogoutButtons = () => screen.queryAllByRole('button', { name: 'Logout' });

describe('Header', () => {
  beforeEach(() => {
    deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
    deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);
  });

  it('projects에서 로그인했으면 데스크톱과 모바일 메뉴에 로그아웃 버튼을 보여 준다', () => {
    setCookie(COOKIE_KEYS.ACCESS_TOKEN, 'access-token');
    setCookie(COOKIE_KEYS.REFRESH_TOKEN, 'refresh-token');

    renderWithProviders(<Header role="projects" />);

    expect(queryLogoutButtons()).toHaveLength(2);
  });

  it('projects에서 액세스 토큰이 만료돼 리프레시 토큰만 남아 있어도 로그아웃 버튼을 보여 준다', () => {
    setCookie(COOKIE_KEYS.REFRESH_TOKEN, 'refresh-token');

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
});
