# Contributing

## 개발 환경

- Node.js 24 (`package.json`의 `engines`, `.npmrc`의 `engine-strict`로 강제)
- pnpm 10 (`packageManager`에 지정된 버전)

## 테스트

### 실행

```bash
pnpm test                          # 모든 패키지 (turbo)
pnpm --filter admin test           # 한 패키지만
pnpm --filter admin test:watch     # 파일을 고칠 때마다 다시 실행
```

CI는 PR마다 `lint → check-types → test → build` 순서로 실행한다.

### 구성

| 패키지                | 역할                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `@repo/vitest-config` | 공용 Vitest 설정. `node`(순수 로직·route handler·middleware), `react`(컴포넌트·훅, jsdom)             |
| `@repo/test-utils`    | `renderWithProviders`, MSW 서버와 응답 도우미, 도메인 fixture, `next/navigation` mock, `selectOption` |

새 패키지에 테스트를 붙일 때는 기존 패키지의 `vitest.config.mts`, `vitest.setup.ts`를 복사하고
`test`, `test:watch` 스크립트와 `@repo/test-utils`, `@repo/vitest-config`, `vitest` devDependency를 추가한다.

### 파일 위치와 이름

- 테스트 대상 옆에 `*.test.ts(x)`로 둔다. 예: `ui/TagInput/index.tsx` → `ui/TagInput/index.test.tsx`
- 기본 환경은 jsdom이다. DOM이 필요 없는 파일은 맨 위에 `// @vitest-environment node`를 적는다.
- 테스트 이름은 한국어로 **조건과 기대 결과**를 적는다. 예: `'refresh token이 없으면 쿠키를 지우고 /로 보낸다'`

### 규칙

1. **버그를 고치면 재현 테스트를 함께 넣는다.** 고치기 전에는 실패하고 고친 뒤에는 통과해야 한다.
2. **요소는 사용자가 보는 방식으로 찾는다.** `getByRole` > `getByLabelText` > `getByText` 순으로 쓰고, className으로 찾지 않는다.
3. **API 응답은 MSW로 대체한다.** axios나 hook을 `vi.mock`으로 바꾸지 않는다. 인터셉터와 요청 형식까지 실제 코드로 확인하기 위해서다.
   jsdom 한계로 MSW를 쓸 수 없는 경우(예: `FormData` 파일 업로드)만 예외로 하고, 이유를 주석으로 남긴다.
4. **테스트 데이터는 `@repo/test-utils`의 fixture로 만든다.** 테스트에 중요한 값만 덮어쓴다.
5. **Radix Select는 `selectOption`으로 고른다.** jsdom에서는 트리거를 클릭하면 목록이 바로 닫힐 수 있다.
6. **이미 알고 있는 문제는 `it.fails`로 남긴다.** 이름 끝에 `(알려진 문제)`를 붙이고, 고치면 `it`으로 바꾼다.
7. **현재 동작이 의도인지 불분명하면** 테스트는 현재 동작대로 쓰고 `현재 동작을 기록한다.` 주석을 남긴다.

```tsx
import {
  apiPath,
  apiSuccess,
  createStudent,
  createStudentListData,
  http,
  renderWithProviders,
  screen,
  server,
} from '@repo/test-utils';

it('학생 목록을 보여준다', async () => {
  server.use(
    http.get(apiPath('/v1/students'), () =>
      apiSuccess(createStudentListData([createStudent({ name: '홍길동' })])),
    ),
  );
  renderWithProviders(<StudentsPage />);

  expect(await screen.findByRole('cell', { name: '홍길동' })).toBeInTheDocument();
});
```
