import { defineConfig } from 'vitest/config';

/**
 * 순수 로직, route handler, middleware 테스트용 설정.
 * 각 패키지의 tsconfig paths(`@/*`, `@repo/shared/*`)를 그대로 해석한다.
 *
 * @type {import("vitest/config").UserConfig}
 * */
export const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    // CI 머신은 로컬보다 느리므로 기본 제한 시간(5초)으로는 무거운 테스트가 불안정해진다.
    testTimeout: 15_000,
    passWithNoTests: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
