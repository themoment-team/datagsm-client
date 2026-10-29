// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { config, middleware } from './middleware';

const requestTo = (path: string, cookies: Record<string, string> = {}) => {
  const request = new NextRequest(new URL(path, 'http://localhost:3002'));
  Object.entries(cookies).forEach(([name, value]) => request.cookies.set(name, value));
  return request;
};

describe('projects middleware', () => {
  it('/api 요청에는 httpOnly accessToken 쿠키를 Authorization 헤더로 옮겨 붙인다', () => {
    const response = middleware(requestTo('/api/v1/projects', { accessToken: 'token' }));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-middleware-request-authorization')).toBe('Bearer token');
  });

  it('로그인하지 않았으면 로그인으로 보내지 않고 그대로 통과시킨다', () => {
    const response = middleware(requestTo('/api/v1/projects'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });

  describe('페이지 요청', () => {
    it('로그인하지 않았으면 로그인으로 보내지 않고 그대로 보여 준다', () => {
      const response = middleware(requestTo('/me'));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(response.headers.get('location')).toBeNull();
      expect(response.cookies.get('loggedIn')).toBeUndefined();
    });

    it('표시 쿠키 도입 전에 로그인해 토큰 쿠키만 있으면 로그인 표시 쿠키를 채운다', () => {
      // 채우지 않으면 내 프로젝트 화면이 로그인하지 않은 것으로 보고 다시 로그인시킨다.
      const response = middleware(requestTo('/me', { refreshToken: 'refresh-1' }));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(response.cookies.get('loggedIn')?.value).toBe('1');
    });
  });

  describe('matcher', () => {
    const pageMatcher = new RegExp(`^${config.matcher[0]}$`);

    it.each(['/', '/me', '/projects/1'])('%s 페이지에는 적용한다', (path) => {
      expect(pageMatcher.test(path)).toBe(true);
    });

    it.each(['/_next/static/chunk.js', '/favicon.ico', '/logo.svg'])(
      '%s에는 적용하지 않는다',
      (path) => {
        expect(pageMatcher.test(path)).toBe(false);
      },
    );

    it('/api 요청은 별도 matcher로 받는다', () => {
      expect(config.matcher).toContain('/api/:path*');
    });
  });
});
