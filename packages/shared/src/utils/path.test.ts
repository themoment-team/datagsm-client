// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { isValidRelativePath } from './path';

describe('isValidRelativePath', () => {
  it.each(['/', '/students', '/oauth/authorize?x=1'])(
    '%s는 같은 사이트 경로로 허용한다',
    (path) => {
      expect(isValidRelativePath(path)).toBe(true);
    },
  );

  // 오픈 리다이렉트를 막기 위해 다른 호스트로 가는 형태는 거부해야 한다.
  it.each(['//evil.com', 'https://evil.com', 'students', ''])('%s는 거부한다', (path) => {
    expect(isValidRelativePath(path)).toBe(false);
  });

  // URL 파서는 \를 /로 바꿔 읽으므로 /\evil.com은 //evil.com과 같다.
  it('/\\evil.com은 URL로 해석하면 다른 호스트가 된다', () => {
    expect(new URL('/\\evil.com', 'https://datagsm.kr').host).toBe('evil.com');
  });

  it('/\\evil.com처럼 다른 호스트로 해석되는 경로를 거부한다', () => {
    expect(isValidRelativePath('/\\evil.com')).toBe(false);
  });

  // 제어문자를 끼워 넣어 검증을 우회하려는 경로도 거부한다.
  it.each(['/\tevil.com', '/\nevil.com', '/foo\r\nSet-Cookie: x'])('%s는 거부한다', (path) => {
    expect(isValidRelativePath(path)).toBe(false);
  });
});
