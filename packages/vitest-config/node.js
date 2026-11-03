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
    // CI는 패키지 2개를 함께 돌리므로(`--concurrency=2`), 패키지마다 워커를 2개로 묶어 4 vCPU 러너를 넘기지 않는다.
    maxWorkers: process.env.CI ? 2 : undefined,
    passWithNoTests: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
