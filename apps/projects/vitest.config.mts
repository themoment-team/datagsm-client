import { config } from '@repo/vitest-config/react';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  config,
  defineConfig({
    test: {
      setupFiles: ['@repo/test-utils/setup', './vitest.setup.ts'],
    },
  }),
);
