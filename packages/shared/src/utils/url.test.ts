// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { HTTP_URL_PATTERN, getSafeUrl } from './url';

describe('HTTP_URL_PATTERN', () => {
  it.each(['https://datagsm.kr', 'http://localhost:3000/path?q=1'])('%s는 허용한다', (url) => {
    expect(HTTP_URL_PATTERN.test(url)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'ftp://datagsm.kr',
    'datagsm.kr',
    // 서버 정규식은 대소문자를 구분한다
    'HTTPS://datagsm.kr',
  ])('%s는 거부한다', (url) => {
    expect(HTTP_URL_PATTERN.test(url)).toBe(false);
  });
});

describe('getSafeUrl', () => {
  it('http(s) 주소만 그대로 돌려준다', () => {
    expect(getSafeUrl('https://datagsm.kr')).toBe('https://datagsm.kr');
    expect(getSafeUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it.each([null, undefined, '', 'javascript:alert(1)', ' javascript:alert(1)', 'ftp://datagsm.kr'])(
    '%s는 링크로 쓰지 않는다',
    (url) => {
      expect(getSafeUrl(url)).toBeNull();
    },
  );
});
