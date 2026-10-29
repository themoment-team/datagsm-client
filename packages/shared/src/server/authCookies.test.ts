// @vitest-environment node
import { NextRequest, NextResponse } from 'next/server';

import { describe, expect, it } from 'vitest';

import { backfillLoggedInCookie } from './authCookies';

const requestWith = (cookies: Record<string, string>) => {
  const request = new NextRequest('http://localhost:3000/me');
  Object.entries(cookies).forEach(([name, value]) => request.cookies.set(name, value));
  return request;
};

describe('backfillLoggedInCookie', () => {
  it.each([
    ['accessToken만 있으면', { accessToken: 'access-1' }],
    ['refreshToken만 있으면', { refreshToken: 'refresh-1' }],
  ])('표시 쿠키 도입 전에 로그인해 %s 로그인 표시 쿠키를 30일로 채운다', (_, cookies) => {
    const response = backfillLoggedInCookie(requestWith(cookies), NextResponse.next());

    expect(response.cookies.get('loggedIn')).toMatchObject({
      value: '1',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('표시 쿠키가 이미 있으면 수명을 늘리지 않도록 다시 심지 않는다', () => {
    const response = backfillLoggedInCookie(
      requestWith({ accessToken: 'access-1', loggedIn: '1' }),
      NextResponse.next(),
    );

    expect(response.cookies.get('loggedIn')).toBeUndefined();
  });

  it('토큰 쿠키가 없으면 심지 않는다', () => {
    const response = backfillLoggedInCookie(requestWith({}), NextResponse.next());

    expect(response.cookies.get('loggedIn')).toBeUndefined();
  });
});
