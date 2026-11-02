// @vitest-environment node
import { describe, expect, it } from 'vitest';

import nextConfig from '../next.config';

describe('next.config', () => {
  it('모든 경로 응답에 iframe 삽입 차단 헤더를 붙인다', async () => {
    const routes = (await nextConfig.headers?.()) ?? [];
    const allPaths = routes.find((route) => route.source === '/:path*');

    expect(allPaths?.headers).toEqual(
      expect.arrayContaining([
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      ]),
    );
  });

  it('X-Powered-By 헤더를 보내지 않는다', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
