# `@repo/vitest-config`

공용 Vitest 설정.

- `@repo/vitest-config/node`: 순수 로직, route handler, middleware
- `@repo/vitest-config/react`: 컴포넌트·훅 (jsdom, jest-dom 매처, Radix용 polyfill)

```ts
// vitest.config.ts
import { config } from '@repo/vitest-config/react';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(config, defineConfig({}));
```
