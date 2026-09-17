# `@repo/test-utils`

테스트 도우미 모음.

- `renderWithProviders`, `renderHookWithProviders`: React Query와 토스트를 감싸서 렌더링
- Testing Library(`screen`, `waitFor`, `userEvent` 등)도 함께 내보내므로 패키지마다 따로 설치하지 않는다
- `@repo/test-utils/next-navigation`: `next/navigation` 대체 구현과 상태 조작 함수
- `@repo/test-utils/setup`: 렌더링 정리와 navigation mock 초기화

```ts
// vitest.config.mts (패키지가 "type": "module"이 아니면 .mts로 만든다)
export default mergeConfig(
  config,
  defineConfig({ test: { setupFiles: ['@repo/test-utils/setup', './vitest.setup.ts'] } }),
);
```

```ts
// vitest.setup.ts
import { vi } from 'vitest';

vi.mock('next/navigation', async () => {
  const { nextNavigationMock } = await import('@repo/test-utils/next-navigation');
  return nextNavigationMock;
});
```
