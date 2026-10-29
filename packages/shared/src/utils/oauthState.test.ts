import { describe, expect, it } from 'vitest';

import { createOAuthState, parseOAuthState } from './oauthState';

describe('createOAuthState', () => {
  it('요청마다 다른 nonce를 만들고 state에 nonce와 돌아갈 경로를 함께 담는다', () => {
    const first = createOAuthState('/students');
    const second = createOAuthState('/students');

    expect(first.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.state).toBe(`${first.nonce}./students`);
    expect(second.nonce).not.toBe(first.nonce);
  });
});

describe('parseOAuthState', () => {
  it('nonce가 같으면 돌아갈 경로를 돌려준다', () => {
    const { nonce, state } = createOAuthState('/clubs/1');

    expect(parseOAuthState(state, nonce)).toBe('/clubs/1');
  });

  it('경로에 .이 있어도 첫 .에서만 나눈다', () => {
    const { nonce, state } = createOAuthState('/files/report.v2.pdf');

    expect(parseOAuthState(state, nonce)).toBe('/files/report.v2.pdf');
  });

  it.each([
    ['nonce가 다르면', 'attacker.', 'nonce-1'],
    ['state에 nonce 없이 경로만 있으면', '/students', 'nonce-1'],
    ['state가 없으면', null, 'nonce-1'],
    ['쿠키 nonce가 없으면', 'nonce-1./students', undefined],
    ['nonce가 빈 문자열이면', './students', ''],
  ])('%s null을 돌려준다', (_, state, nonce) => {
    expect(parseOAuthState(state, nonce)).toBeNull();
  });
});
