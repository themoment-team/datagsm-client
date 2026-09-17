# `@repo/test-utils`

테스트 도우미 모음.

- `renderWithProviders`, `renderHookWithProviders`: React Query와 토스트를 감싸서 렌더링
- Testing Library(`screen`, `waitFor`, `userEvent` 등)도 함께 내보내므로 패키지마다 따로 설치하지 않는다
- `@repo/test-utils/next-navigation`: `next/navigation` 대체 구현과 상태 조작 함수
- `@repo/test-utils/setup`: MSW 서버 시작·초기화, 렌더링 정리, navigation mock·fixture id 초기화

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

## API 응답 대체 (MSW)

기본 핸들러는 없다. 테스트에서 필요한 응답만 등록하고, 등록하지 않은 요청은 실패한다.
등록한 핸들러는 테스트가 끝나면 초기화된다.

```ts
import { apiError, apiPath, apiSuccess, http, server } from '@repo/test-utils';

server.use(http.get(apiPath('/v1/students'), () => apiSuccess(studentList)));
server.use(http.put(apiPath('/v1/students/:id'), () => apiError(400, '중복된 학번입니다.')));
```

## 도메인 fixture

`@repo/shared/types`의 타입을 그대로 따르므로, 타입이 바뀌면 fixture에서 타입 에러가 난다.
테스트에 중요한 값만 덮어쓰고 나머지는 기본값을 쓴다. id는 테스트마다 1부터 다시 시작한다.

```ts
const student = createStudent({ grade: 3, role: 'STUDENT_COUNCIL' });
const club = createClub({ leader: toClubMember(student) });

server.use(http.get(apiPath('/v1/students'), () => apiSuccess(createStudentListData([student]))));
```
