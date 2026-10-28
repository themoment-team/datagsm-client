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

  it('조회 화면은 비로그인으로 열려 있어 /api 요청에만 적용한다', () => {
    expect(config.matcher).toEqual(['/api/:path*']);
  });
});
