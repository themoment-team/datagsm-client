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
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
