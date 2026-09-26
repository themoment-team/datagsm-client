import { beforeEach, describe, expect, it } from 'vitest';

import { clearAllCookies, deleteCookie, getAllCookies, getCookie, setCookie } from './cookies';

const expireAll = () => {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

describe('cookies', () => {
  beforeEach(expireAll);

  it('저장한 값을 이름으로 읽는다', () => {
    setCookie('accessToken', 'token-1');
    setCookie('refreshToken', 'token-2');

    expect(getCookie('accessToken')).toBe('token-1');
    expect(getCookie('refreshToken')).toBe('token-2');
  });

  it('특수문자와 한글을 인코딩해 저장하고 원래 값으로 읽는다', () => {
    setCookie('name', '홍 길동; a=b');

    expect(document.cookie).not.toContain('홍');
    expect(getCookie('name')).toBe('홍 길동; a=b');
  });

  it('없는 이름이나 앞부분만 같은 이름은 null을 돌려준다', () => {
    setCookie('accessTokenOld', 'x');

    expect(getCookie('accessToken')).toBeNull();
  });

  it('삭제하면 더 이상 읽히지 않는다', () => {
    setCookie('accessToken', 'token');
    deleteCookie('accessToken');

    expect(getCookie('accessToken')).toBeNull();
  });

  it('모든 쿠키를 객체로 읽고, 한 번에 지운다', () => {
    setCookie('a', '1');
    setCookie('b', '2');

    expect(getAllCookies()).toEqual({ a: '1', b: '2' });

    clearAllCookies();
    expect(getAllCookies()).toEqual({});
  });

  it('서버가 인코딩 없이 저장한 =가 들어간 값도 전부 읽는다', () => {
    document.cookie = 'raw=abc==; Path=/';

    expect(getAllCookies()).toEqual({ raw: 'abc==' });
  });

  it('디코딩할 수 없는 %가 섞인 쿠키는 원문으로 읽고, 나머지 쿠키도 계속 읽는다', () => {
    document.cookie = 'discount=100%; Path=/';
    setCookie('b', '2');

    expect(getAllCookies()).toEqual({ discount: '100%', b: '2' });
  });
});
