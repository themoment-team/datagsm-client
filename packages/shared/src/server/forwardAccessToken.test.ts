// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { forwardAccessToken } from './forwardAccessToken';

const requestTo = (cookies: Record<string, string> = {}, headers: Record<string, string> = {}) => {
  const request = new NextRequest('http://localhost:3000/api/v1/students', { headers });
  Object.entries(cookies).forEach(([name, value]) => request.cookies.set(name, value));
  return request;
};

/** NextResponse.next({ request: { headers } })로 바꾼 요청 헤더는 x-middleware-request-* 로 실린다. */
const forwardedAuthorization = (response: Response) =>
  response.headers.get('x-middleware-request-authorization');

describe('forwardAccessToken', () => {
  it('accessToken 쿠키를 Bearer Authorization 헤더로 옮겨 붙인다', () => {
    const response = forwardAccessToken(requestTo({ accessToken: 'access-1' }));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(forwardedAuthorization(response)).toBe('Bearer access-1');
  });

  it('accessToken 쿠키가 없으면 헤더를 붙이지 않고 통과시킨다', () => {
    const response = forwardAccessToken(requestTo());

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(forwardedAuthorization(response)).toBeNull();
  });

  it('요청에 이미 Authorization이 있으면 덮어쓰지 않는다', () => {
    const response = forwardAccessToken(
      requestTo({ accessToken: 'access-1' }, { Authorization: 'Bearer other' }),
    );

    expect(forwardedAuthorization(response)).toBeNull();
  });
});
