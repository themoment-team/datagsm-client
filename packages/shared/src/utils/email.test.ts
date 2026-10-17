// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatEmailWithDomain } from './email';

describe('formatEmailWithDomain', () => {
  it('학교 도메인이 없으면 붙인다', () => {
    expect(formatEmailWithDomain('s25001')).toBe('s25001@gsm.hs.kr');
  });

  it('이미 학교 도메인이 있으면 그대로 둔다', () => {
    expect(formatEmailWithDomain('s25001@gsm.hs.kr')).toBe('s25001@gsm.hs.kr');
  });

  // 다른 도메인을 거르지 않는다. 현재 동작을 기록한다.
  it('다른 도메인 뒤에도 학교 도메인을 붙인다', () => {
    expect(formatEmailWithDomain('user@example.com')).toBe('user@example.com@gsm.hs.kr');
  });
});
