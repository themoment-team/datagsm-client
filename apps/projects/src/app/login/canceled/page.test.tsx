import { render, screen, setMockSearchParams } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import LoginCanceled from './page';

describe('로그인 취소 페이지 (projects)', () => {
  it('다시 로그인하면 원래 경로를 들고 /api/login에서 로그인을 시작한다', () => {
    setMockSearchParams({ error: 'access_denied', returnTo: '/me' });

    render(<LoginCanceled />);

    expect(screen.getByRole('heading', { name: '로그인 취소' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '다시 로그인' })).toHaveAttribute(
      'href',
      '/api/login?returnTo=%2Fme',
    );
  });
});
