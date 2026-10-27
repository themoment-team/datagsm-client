/**
 * 모든 앱 응답에 붙이는 보안 헤더. 각 앱 `next.config.ts`의 `headers()`에서 쓴다.
 * 서비스끼리 서로를 iframe으로 띄우지 않으므로 프레임 삽입은 전부 막는다.
 * 전체 CSP(`script-src` 등)는 GA·Mermaid 등 외부 스크립트 정리가 필요해 `frame-ancestors`만 둔다.
 */
export const SECURITY_HEADERS = [
  // 클릭재킹 방지. 구형 브라우저는 X-Frame-Options, 최신 브라우저는 frame-ancestors를 따른다.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
