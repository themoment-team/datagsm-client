/**
 * 모든 앱 응답에 붙이는 보안 헤더.
 * 서비스끼리 서로를 iframe으로 띄우지 않고 외부 임베드도 허용하지 않으므로, docs·status를 포함한 모든 앱에서 프레임 삽입을 막는다.
 * HSTS는 Vercel이 모든 응답에 붙이므로 여기서 보내지 않는다.
 */
export const SECURITY_HEADERS = [
  // 클릭재킹 방지. 구형 브라우저는 X-Frame-Options, 최신 브라우저는 frame-ancestors를 따른다.
  { key: 'X-Frame-Options', value: 'DENY' },
  // 브라우저는 응답에 담긴 CSP를 모두 동시에 적용하므로 CSP는 이 값 하나로만 관리한다.
  // middleware·vercel.json 등 다른 곳에서 CSP를 추가하지 말고, 전체 CSP(`script-src` 등)를 도입할 때는 이 값을 확장한다.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

/**
 * 각 앱 `next.config.ts`의 `headers()`가 그대로 반환하는 라우트 규칙.
 * 새 앱을 만들면 `headers()`에서 이 값을 반환하고 `src/nextConfig.test.ts`로 연결을 검증한다.
 */
export const SECURITY_HEADER_ROUTES = [{ source: '/:path*', headers: SECURITY_HEADERS }];
