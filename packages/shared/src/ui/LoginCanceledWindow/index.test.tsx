import { render, screen, setMockSearchParams } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import { LoginCanceledWindow } from '.';

const getLoginLink = () => screen.getByRole('link', { name: '다시 로그인' });

describe('LoginCanceledWindow', () => {
  it('동의를 거부해 돌아왔으면 로그인 취소를 알리고, 원래 경로로 다시 로그인하게 한다', () => {
    setMockSearchParams({ error: 'access_denied', returnTo: '/students' });

    render(<LoginCanceledWindow />);

    expect(screen.getByRole('heading', { name: '로그인 취소' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '접근 권한 요청을 거부해 로그인이 취소되었습니다. 서비스를 이용하려면 다시 로그인해주세요.',
      ),
    ).toBeInTheDocument();
    expect(getLoginLink()).toHaveAttribute('href', '/students');
  });

  it('그 외 오류로 돌아왔으면 취소가 아니라 로그인을 완료하지 못했다고 알린다', () => {
    setMockSearchParams({ error: 'server_error', returnTo: '/students' });

    render(<LoginCanceledWindow />);

    expect(screen.getByRole('heading', { name: '로그인 실패' })).toBeInTheDocument();
    expect(
      screen.getByText('로그인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument();
    expect(getLoginLink()).toHaveAttribute('href', '/students');
  });

  it('로그인 경로를 넘기면 돌아갈 경로를 returnTo로 붙여 그 경로에서 로그인을 시작한다', () => {
    setMockSearchParams({ error: 'access_denied', returnTo: '/me?tab=1' });

    render(<LoginCanceledWindow loginPath="/api/login" />);

    expect(getLoginLink()).toHaveAttribute('href', '/api/login?returnTo=%2Fme%3Ftab%3D1');
  });

  // 안내 화면 주소는 누구나 만들어 보낼 수 있으므로 다른 사이트로 보내는 경로는 쓰지 않는다.
  it.each([
    ['없으면', {}],
    ['다른 호스트면', { returnTo: '//evil.com' }],
    ['절대 URL이면', { returnTo: 'https://evil.com' }],
    ['/\\evil.com이면', { returnTo: '/\\evil.com' }],
  ])('돌아갈 경로가 %s /로 다시 로그인하게 한다', (_, params) => {
    setMockSearchParams({ error: 'access_denied', ...params });

    render(<LoginCanceledWindow />);

    expect(getLoginLink()).toHaveAttribute('href', '/');
  });
});
