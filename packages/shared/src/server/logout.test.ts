// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { logoutHandler } from './logout';

describe('logoutHandler', () => {
  it('토큰 쿠키와 로그인 표시 쿠키를 모두 지우고 204로 응답한다', async () => {
    const response = await logoutHandler();

    expect(response.status).toBe(204);
    ['accessToken', 'refreshToken', 'loggedIn'].forEach((name) => {
      expect(response.cookies.get(name)).toMatchObject({
        value: '',
        path: '/',
        expires: new Date(0),
      });
    });
  });
});
