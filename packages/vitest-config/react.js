import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vitest/config';

import { config as nodeConfig } from './node.js';

/**
 * 컴포넌트·훅 테스트용 설정. 기본 환경은 jsdom이고,
 * node 환경이 필요한 파일은 맨 위에 `// @vitest-environment node`를 적는다.
 *
 * @type {import("vitest/config").UserConfig}
 * */
export const config = mergeConfig(nodeConfig, {
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [fileURLToPath(new URL('./setup/jsdom.js', import.meta.url))],
  },
});
