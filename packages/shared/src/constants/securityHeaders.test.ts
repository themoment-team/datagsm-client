// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { SECURITY_HEADERS } from './securityHeaders';

const getHeader = (key: string) => SECURITY_HEADERS.find((header) => header.key === key)?.value;

describe('SECURITY_HEADERS', () => {
  it('구형·최신 브라우저 모두에서 iframe 삽입을 막는다', () => {
    expect(getHeader('X-Frame-Options')).toBe('DENY');
    expect(getHeader('Content-Security-Policy')).toBe("frame-ancestors 'none'");
  });

  it('MIME 스니핑을 막고 외부로 나가는 Referer를 오리진으로 줄인다', () => {
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff');
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});
