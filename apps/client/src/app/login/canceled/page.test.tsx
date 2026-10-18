import { render, screen, setMockSearchParams } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import LoginCanceled from './page';

describe('로그인 취소 페이지 (client)', () => {
  it('다시 로그인하면 원래 경로로 보내 미들웨어가 인가를 시작하게 한다', () => {
    setMockSearchParams({ error: 'access_denied', returnTo: '/clients' });

    render(<LoginCanceled />);

    expect(screen.getByRole('heading', { name: '로그인 취소' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '다시 로그인' })).toHaveAttribute('href', '/clients');
  });
});
