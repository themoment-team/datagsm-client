# DataGSM Front 코드베이스 점검 리포트

> **작성일**: 2026-06-15
> **대상 브랜치**: `develop`
> **범위**: 모노레포 전체 (`apps/*`, `packages/*`)
> **방법**: 정적 분석(grep) + 핵심 구현 코드 정독

---

## 개요

Turborepo + pnpm 모노레포(앱 5개 `client`/`admin`/`docs`/`status`/`oauth`, 공유 패키지 4개)를 대상으로
보안 · 정합성 · 중복 · 추상화 · 접근성 · 환경설정 · **아키텍처(레이어 경계)** 관점에서 점검한 결과를 정리한다.
총 **24건**을 식별했으며 심각도별로 분류한다.

### 심각도 요약

| 심각도         | 건수 | 의미                                                       |
| -------------- | ---- | ---------------------------------------------------------- |
| 🔴 Critical    | 6    | 보안 취약점 또는 실제 동작 버그 / 죽은 코드                |
| 🟠 Important   | 9    | 견고성 · 일관성 · 레이어 경계 결함 (잠재적 버그/구조 부채) |
| 🟡 Improvement | 9    | 품질 · 유지보수 · 접근성 개선                              |

> ID 접두사: **C**=Critical, **I**=Important, **Q**=Improvement, **A**=Architecture(레이어 경계).

### 전체 항목 색인

| ID  | 제목                                                | 심각도 | 주요 위치                                                   |
| --- | --------------------------------------------------- | ------ | ----------------------------------------------------------- |
| C1  | `client_secret`이 `NEXT_PUBLIC_`로 노출             | 🔴     | `shared/lib/axios.ts:75`                                    |
| C2  | 토큰을 `httpOnly:false` 쿠키에 저장 (XSS)           | 🔴     | `*/api/callback/route.ts`                                   |
| C3  | OAuth 토큰 응답 파싱 불일치                         | 🔴     | `oauth/token/route.ts` ↔ `callback/route.ts`                |
| C4  | CI ↔ 코드 환경변수 네이밍 불일치                    | 🔴     | `.github/workflows/ci.yml`                                  |
| C5  | `useExchangeToken` 실행 불가능한 죽은 코드          | 🔴     | `shared/hooks/useExchangeToken.ts:22`                       |
| C6  | 로그아웃이 서버 토큰을 폐기하지 않음                | 🔴     | `shared/ui/Header/index.tsx:839`                            |
| I1  | 라우트 핸들러 · 미들웨어 대량 중복                  | 🟠     | `admin`/`client`/`oauth`                                    |
| I2  | 서버 fetch 헬퍼 에러 처리 불일치 + 무음 실패        | 🟠     | `client/views/*/api/*.ts`                                   |
| I3  | 토큰 갱신 후 쿠키가 세션 쿠키로 강등                | 🟠     | `shared/lib/axios.ts:82`                                    |
| I4  | `apiUrls`/`queryKeys` 위치 인자 컨벤션 혼재         | 🟠     | `shared/api/apiUrls.ts:7`                                   |
| I5  | `queryKeys` 추상화 18곳 전면 우회                   | 🟠     | 위젯 다수                                                   |
| I6  | `useGetOAuthSession` 캐시 설계 문제                 | 🟠     | `oauth/.../useGetOAuthSession.ts`                           |
| Q1  | 테스트 전무                                         | 🟡     | 전체                                                        |
| Q2  | `console.error` 산재 (14곳)                         | 🟡     | 전체                                                        |
| Q3  | 루트 문서/README 빈약, `.env.example` 부재          | 🟡     | 루트                                                        |
| Q4  | OAuth `state`를 CSRF 토큰으로 사용하지 않음         | 🟡     | `*/middleware.ts:37`                                        |
| Q5  | `StudentFormDialog` 707줄 + 보일러플레이트 반복     | 🟡     | `admin/.../StudentFormDialog`                               |
| Q6  | `CommonPagination`을 `<a href="#">`로 구현          | 🟡     | `shared/ui/CommonPagination`                                |
| Q7  | 비활성 필드를 빈 `<div>`로 대체 (접근성)            | 🟡     | `admin/.../StudentFormDialog`                               |
| Q8  | 모바일 메뉴 접근성 미흡 (focus trap 등)             | 🟡     | `shared/ui/Header/index.tsx:919`                            |
| A1  | `shared/ui`에 도메인·API·비즈니스 로직 혼입         | 🟠     | `shared/ui/ApiKey*`, `SignInForm`, `Header`                 |
| A2  | `shared/types`에 런타임 Zod 스키마 혼입             | 🟠     | `shared/types/auth.ts:33,70`                                |
| A3  | `shared/hooks` 15개 중 12개가 도메인 결합           | 🟠     | `shared/hooks/useApiKey*`, `useExchangeToken` 등            |
| A4  | `utils`/`constants`/`lib`의 경미한 도메인·설정 누수 | 🟡     | `utils/email.ts`, `constants/navigation.ts`, `lib/axios.ts` |

---

## 🔴 Critical

### C1. `client_secret`이 `NEXT_PUBLIC_` 접두사로 노출

**위치**: `packages/shared/src/lib/axios.ts:75`, `apps/admin/src/app/api/oauth/token/route.ts:30`, `apps/admin/src/app/api/callback/route.ts:18`

`NEXT_PUBLIC_DATAGSM_CLIENT_SECRET`을 사용한다. Next.js는 `NEXT_PUBLIC_*` 변수를 **클라이언트 번들에 인라인**하므로,
BFF 라우트 핸들러로 secret을 숨기려는 설계 자체가 무력화된다. 현재는 서버 라우트에서만 참조되지만,
클라이언트 코드에서 같은 변수를 한 번이라도 참조하면 그대로 브라우저로 유출된다.

**조치**: secret은 접두사 없는 서버 전용 변수(`DATAGSM_CLIENT_SECRET`)로 변경.

---

### C2. 토큰을 `httpOnly: false` 쿠키에 저장 (XSS 노출)

**위치**: `apps/admin/src/app/api/callback/route.ts:61,69`, `apps/client/src/app/api/callback/route.ts:59,67`

access / refresh 토큰을 모두 `httpOnly: false`로 저장한다. 클라이언트 axios(`getCookie`)가 읽기 위함이지만,
**XSS 발생 시 토큰 전체가 탈취 가능**하다. 특히 30일짜리 refresh 토큰까지 JS로 읽힌다.

**조치**: 최소한 refresh 토큰은 `httpOnly: true`로 두고 갱신은 BFF 라우트에서 처리.
이상적으로는 모든 API 호출을 서버 프록시로 돌려 access 토큰도 httpOnly화.

---

### C3. 동일 OAuth 엔드포인트(`/v1/oauth/token`) 응답 파싱 불일치

**위치**:

- `apps/admin/src/app/api/oauth/token/route.ts:65-66` → `responseData.data.access_token` (래핑 가정)
- `packages/shared/src/lib/axios.ts:78` → `response.data.access_token` (래핑 가정)
- `apps/client/src/app/api/callback/route.ts:43-45` → `tokenData.access_token` (**플랫 가정**)

같은 백엔드 엔드포인트를 두 가지 형태로 파싱한다. 둘 중 하나는 토큰이 `undefined`가 되는 버그다.

**조치**: 백엔드 실제 응답 형태를 확인해 한쪽으로 통일. (수정 전 응답 스펙 확인 필요)

---

### C4. 환경변수 네이밍이 CI ↔ 코드 간 불일치

**위치**: `.github/workflows/ci.yml:12-16` vs 코드 사용처

- CI가 주입하는 변수(`NEXT_PUBLIC_OAUTH_AUTH_SERVER_URL`, `..._RESOURCE_SERVER_URL`, `..._OPENAPI_SERVER_URL`, `..._WEB_SERVER_URL`)는 **`status` 앱만** 사용.
- admin/client/oauth 앱이 실제로 쓰는 `NEXT_PUBLIC_OAUTH_BASE_URL`, `NEXT_PUBLIC_DATAGSM_CLIENT_ID/SECRET/REDIRECT_URI`는 **CI에 없음.**

런타임 라우트 핸들러라 빌드는 통과하지만, 네이밍 컨벤션이 앱마다 갈라져 있어 배포·온보딩 시 사고 위험.

**조치**: 변수명 통일 + `.env.example` 추가 (현재 커밋된 예시 파일 없음).

---

### C5. `useExchangeToken`은 실행 불가능한 죽은 코드

**위치**: `packages/shared/src/hooks/useExchangeToken.ts:22`

`sessionStorage.getItem('oauth_code_verifier')`를 읽지만, **코드베이스 어디에도 `oauth_code_verifier`를 sessionStorage에 쓰는 곳이 없다**(read만 존재).
실제 PKCE 플로우는 middleware가 httpOnly 쿠키 `code_verifier`에 저장한다(`middleware.ts:43`).
즉 이 훅은 호출되면 항상 `throw new Error('PKCE code verifier not found')`이며, 어떤 앱도 import하지 않는다.

**동반 의심**: admin의 `app/api/oauth/token/route.ts`, `app/api/oauth/authorize/route.ts`도 호출하는 클라이언트가 없어 보인다(admin은 middleware+callback 플로우 사용).

**조치**: 죽은 훅·라우트를 삭제하거나, 실제 사용 플로우로 통일. (사용처 재확인 후 삭제)

---

### C6. 로그아웃이 서버 토큰을 폐기하지 않음

**위치**: `packages/shared/src/ui/Header/index.tsx:839` (`handleLogout`)

쿠키만 클라이언트에서 삭제하므로 **refresh 토큰(30일)이 서버 측에 그대로 유효**하게 남는다.
토큰 탈취 시 로그아웃해도 무력화되지 않는다.

**조치**: 백엔드 revoke 엔드포인트가 있다면 호출 추가 (C2와 연동).

---

## 🟠 Important

### I1. 라우트 핸들러 · 미들웨어 대량 중복

**위치**:

- `callback/route.ts`: admin ↔ client 거의 동일 (차이는 `client_secret` 포함 여부뿐)
- `api/oauth/authorize/route.ts`: admin ↔ oauth 사실상 동일 (주석만 차이)
- `middleware.ts`: admin ↔ client 동일 (주석/포맷만 차이)

**조치**: `@repo/shared`에 팩토리 함수(예: `createCallbackHandler({ useSecret })`, `createAuthMiddleware()`)로 추출.

---

### I2. 서버 fetch 헬퍼 에러 처리 불일치 + 무음 실패

**위치**: `apps/client/src/views/mypage/api/getMyInfo.ts:23`, `apps/client/src/views/home/api/getApiKey.ts:22`

- `getMyInfo`는 `response.ok` 검사 없이 바로 `.json()` (4xx/5xx에서 에러 본문을 데이터로 반환할 위험). 반면 `getApiKey`는 `response.ok`를 검사 → 두 헬퍼 패턴이 다름.
- 두 곳 모두 `catch { return undefined }`로 **네트워크 오류를 통째로 삼킴** → 장애 원인 추적 불가.

**조치**: `response.ok` 검사 통일 + 최소한 서버 로깅 추가.

---

### I3. 토큰 갱신 후 쿠키가 세션 쿠키로 강등

**위치**: `packages/shared/src/lib/axios.ts:82-83`, `packages/shared/src/utils/cookies.ts:5`

콜백 라우트는 access 1h / refresh 30d로 만료를 설정하지만, 갱신 시 클라이언트 `setCookie`에는 `Max-Age`가 없어
**만료 없는 세션 쿠키**가 된다. 브라우저 종료 시 사라져 만료 정책이 갱신 경로에서 깨진다.

**조치**: `setCookie`에 `maxAge` 옵션 추가.

---

### I4. `apiUrls` / `queryKeys` 함수 시그니처 컨벤션 혼재

**위치**: `packages/shared/src/api/apiUrls.ts:7`(`getStudents`), `:113`(`getClubs`), `packages/shared/src/api/queryKeys.ts`

- `getStudents`는 **11개 위치 인자**, `getClubs`도 위치 인자 → 호출 시 `undefined, undefined, ...` 끼워넣기 강제, 순서 실수 위험.
- 반면 `getApiKeys`/`getProjects`/`getApplications`는 객체 파라미터.

**조치**: 모두 객체 파라미터로 통일.

---

### I5. `queryKeys` 추상화를 18곳에서 전면 우회

**위치**: `admin/.../StudentFormDialog:62,74,166`, `ClubList:40`, `ClubExcelActions:21`, `ClubFormDialog:110,122`, `ProjectsPage:40`, `ProjectFormDialog:173`, `ApiKeyList:42,52`, `StudentExcelActions:20`, client `ClientList:134`, `ClientFormDialog:77,89`, `WebhookList:127`, `WebhookFormDialog:72,84`

`queryKeys.ts`에 팩토리(`studentQueryKeys` 등)를 만들어 놓고, invalidate에서는 `invalidateQueries({ queryKey: ['students'] })`처럼
**문자열 리터럴을 손으로 작성**한다. queryKey 구조를 바꾸면 invalidate가 조용히 깨져 캐시 무효화가 안 되는 버그로 이어진다.

**조치**: 팩토리에 `all: () => ['students']` 같은 prefix 키를 추가하고 전부 그걸 사용하도록 통일.

---

### I6. `useGetOAuthSession` 캐시 설계 문제

**위치**: `apps/oauth/src/widgets/oauth/model/useGetOAuthSession.ts`

- `staleTime: Infinity` + `gcTime: Infinity` → 세션/스코프 정보가 **영구 stale**. 서버에서 스코프가 바뀌어도 반영 안 됨.
- localStorage 캐시를 `JSON.parse` 후 필드 존재만 느슨하게 검사(`line 20`) → 변조/구버전 캐시에 취약.
- 상수명 `STORAGE_KEY = 'oauth_session_timestamp'`인데 실제 저장 내용은 serviceName/expiresAt/scopes → 이름과 내용 불일치.

**조치**: 합리적 `staleTime` 설정 + 캐시 스키마 검증(zod) + 상수명 정정.

---

## 🟡 Improvement

### Q1. 테스트 전무

**위치**: 전체

워크스페이스에 `*.test.*` / `*.spec.*` 파일이 0개. CI도 `lint → check-types → build`만 수행.
PKCE 생성, axios 인터셉터(토큰 갱신 큐), Zod 스키마 등 핵심 로직에 단위 테스트 부재.

**조치**: 최소한 인증/토큰 갱신 경로부터 단위 테스트 도입.

---

### Q2. `console.error` 산재 (14곳)

**위치**: `admin` 위젯 다수, `packages/shared/src/hooks/useCopyToClipboard.ts:25`, `apps/docs/.../Mermaid/index.tsx:29` 등

프로덕션 로깅 전략 부재. 사용자 토스트는 띄우되 콘솔 로그는 일관된 로거로 대체하거나 정리.

---

### Q3. 루트 문서 / `.env.example` 부재

**위치**: 루트

`README.md`는 2줄. 5개 앱의 포트·역할, 필요한 환경변수, 로컬 실행법, FSD 레이어 규칙이 문서화되어 있지 않음.
커밋된 `.env.example`도 없어 신규 기여자 온보딩 비용이 큼.

**조치**: 루트 README 보강 + 앱별 `.env.example` 추가.

---

### Q4. OAuth `state`를 CSRF 토큰으로 사용하지 않음

**위치**: `apps/admin/src/middleware.ts:37`

OAuth `state`에 `pathname`을 넣고 콜백에서 `isValidRelativePath`로만 검증한다.
`state` 본래 목적인 **CSRF 방지 난수 검증이 없음**.

**조치**: 경로 저장은 별도 쿠키로, `state`는 난수로 분리해 콜백에서 대조.

---

### Q5. `StudentFormDialog` 707줄 단일 컴포넌트 + 보일러플레이트 반복

**위치**: `apps/admin/src/widgets/students/ui/StudentFormDialog/index.tsx`

- `isInactive ? <빈 disabled div> : <실제 필드>` 패턴이 8개 필드에 거의 그대로 반복.
- `defaultValues`(line 144-160)와 `useEffect`의 `reset`(line 169-182)이 동일 객체를 두 번 작성 → 한쪽만 고치면 어긋남.
- `ClubFormDialog`/`ProjectFormDialog`도 동일 구조.

**조치**: 공통 `<FormField>`/`<DisabledField>` 추출로 중복 제거.

---

### Q6. `CommonPagination`을 `<a href="#">`로 구현

**위치**: `packages/shared/src/ui/CommonPagination/index.tsx:774,787,801`

`href="#"` + `preventDefault`로 페이지 이동 → 시맨틱상 버튼이어야 함.
스크린리더/키보드 접근성, 우클릭·새 탭 동작 문제.

**조치**: `<button>` 또는 Radix 버튼 기반으로 교체.

---

### Q7. 비활성 필드를 의미 없는 빈 `<div>`로 대체 (접근성)

**위치**: `apps/admin/.../StudentFormDialog/index.tsx:337,375,414 …`

졸업/자퇴 시 입력란을 라벨만 남기고 빈 회색 박스로 표시 → 스크린리더에 정보 없음, 비활성 사유 안내 없음.

**조치**: `disabled` 입력 + 사유 텍스트로 대체.

---

### Q8. 모바일 메뉴 접근성 미흡

**위치**: `packages/shared/src/ui/Header/index.tsx:919-958`

focus trap 없음, `Esc`로 닫기 없음, 열렸을 때 body 스크롤 잠금 없음 (`tabIndex` 토글만 존재).

**조치**: focus trap · Esc 닫기 · body scroll lock 추가.

---

## 🏛️ Architecture — 레이어 경계 위반

> **공통 근본 원인**: `@repo/shared`는 가장 하위 레이어라 _도메인을 몰라야_ 하는데,
> 현재 ApiKey/OAuth 도메인이 `ui` · `types` · `hooks` 전반에 침투해 있다.
> 개별 결함이 아니라 "도메인 코드가 shared 전 계층에 퍼진" 구조적 문제다.

### `shared/ui` 컴포넌트 분류 (근거)

| 컴포넌트                           | 줄수 |     API 호출      |   서버상태(QueryClient)    |               도메인 로직                | 판정         |
| ---------------------------------- | ---- | :---------------: | :------------------------: | :--------------------------------------: | ------------ |
| ApiKeyForm                         | 346  |     ✅ 훅 5개     | ✅ setQueryData/invalidate |         ✅ rotate vs update 분기         | 🔴 위젯/피처 |
| ApiKeyDisplay                      | 156  | ✅ `useGetApiKey` |             –              |              ✅ 마스킹/복사              | 🔴 위젯      |
| ApiKeyManager                      | 36   |      (조합)       |             –              |            ✅ 도메인 컨테이너            | 🔴 위젯      |
| SignInForm                         | 319  |       (폼)        |             –              | ✅ `formatEmailWithDomain`, scope 스키마 | 🟠 피처      |
| Header                             | 154  |         –         |  ✅ `queryClient.clear()`  |            ✅ `handleLogout`             | 🟠 인증 로직 |
| Button/Input/Dialog/Table/Select … | –    |         –         |             –              |                    –                     | ✅ 순수      |

---

### A1. `shared/ui`에 도메인·API·비즈니스 로직 혼입

**위치**: `packages/shared/src/ui/ApiKeyForm`, `ApiKeyDisplay`, `ApiKeyManager`, `SignInForm`, `Header`

`shared/ui`는 "도메인을 모르는 순수 디자인 시스템"이어야 하지만, 위 컴포넌트들이
API 호출 · 서버 상태 관리 · 비즈니스 규칙을 품고 있다. 대표 사례 `ApiKeyForm`:

```ts
// 1) API 호출 훅 5개 (line 8-14)
(useCreateApiKey, useGetApiKey, useGetAvailableScope, useRotateApiKey, useUpdateApiKey);
// 2) 서버 상태 직접 조작 (line 67-68)
queryClient.setQueryData(authQueryKeys.getApiKey(), data);
queryClient.invalidateQueries({ queryKey: ['auth', 'api-keys', 'list'] });
// 3) 도메인 의사결정 (line 179-183)
if (isApiKeyDataEqual) rotateApiKey();
else updateApiKey();
```

**영향**: 도메인 없는 앱에서 재사용 불가, 백엔드 응답 변경 시 디자인 시스템 수정 필요,
버튼 하나 렌더에도 QueryClient·서버 mock 필요(테스트 난이도 ↑).

**조치**: 순수 컴포넌트만 `shared/ui`에 남기고, 도메인 컴포넌트는 `shared/features`(또는 `/domain`) 또는 별도 패키지로 분리.

---

### A2. `shared/types`에 런타임 Zod 스키마 혼입

**위치**: `packages/shared/src/types/auth.ts:33`(`SignInFormSchema`), `:70`(`ApiKeyFormSchema`)

`types/`는 컴파일 시 소멸해야 하는 타입 전용 모듈인데, Zod 스키마는 **런타임 값**으로 번들에 남는다.
게다가 단순 타입이 아니라 **폼 검증 비즈니스 규칙**(에러 메시지·필수값)이다.
프로젝트 일관성도 깨져 있다 — admin은 `entities/student/model/schema.ts`에 스키마를 두는데(올바른 위치),
auth/apikey 스키마만 `types/`에 있다.

**조치**: 두 스키마를 `model/`(또는 entities) 위치로 이동, `types/`는 `interface`/`type`만 유지.

---

### A3. `shared/hooks` 15개 중 12개가 도메인 결합

**위치**: `packages/shared/src/hooks/`

```
도메인 결합 (12): useGetApiKey, useCreateApiKey, useUpdateApiKey, useRotateApiKey,
  useDeleteApiKey, useDeleteApiKeyById, useUpdateApiKeyExpirationById,
  useGetAvailableScope, useApiKeyScopeSelection(스코프 계층 계산),
  useExchangeToken, useRefreshToken
범용 (3):        useDebounce, useCopyToClipboard, useURLFilters
```

`hooks/`의 80%가 ApiKey/OAuth 도메인 데이터 액세스이며, `useApiKeyScopeSelection`은
스코프 들여쓰기·토글 계층을 계산하는 **도메인 계산 로직**이다. A1과 동일한 레이어 위반.

**조치**: 도메인 훅은 `entities/api-key/model` 등으로 이동, `shared/hooks`는 범용 3개만 유지.

---

### A4. `utils`/`constants`/`lib`의 경미한 도메인·설정 누수

**위치**: `utils/email.ts`, `constants/navigation.ts:1-3`, `lib/axios.ts`

- `formatEmailWithDomain`(`utils/email.ts`) — `@gsm.hs.kr` 상수에 의존하는 **도메인 규칙**(순수 util 아님).
- `constants/navigation.ts` — `process.env`를 모듈 레벨에서 읽어 정적 상수에 **런타임 환경설정** 혼입(→ `config/` 분리가 정확).
- `lib/axios.ts` — http 클라이언트에 OAuth 갱신 플로우 + `window.location.href='/'`(앱 라우팅 정책) 내장(C1·I3와 연결).

**조치**: 영향이 작아 우선순위 낮음. 위 A1~A3 정리 시 함께 조정.

---

## 권장 수정 순서

1. **즉시 정리 가능 (저위험)**: C5(죽은 코드 삭제), I5(queryKey 통일), Q2(console 정리), A2(Zod 스키마 이동)
2. **버그성 (우선순위 높음)**: C3(토큰 파싱 불일치), I3(쿠키 만료 강등), I5(캐시 무효화)
3. **보안 (설계 변경 필요)**: C1, C2, C6
4. **구조 개선(레이어 정리)**: A1·A3(도메인 코드 분리) → I1(중복 제거) → Q5(폼 컴포넌트 분해) → A4
5. **품질/온보딩**: Q1(테스트), Q3(문서), Q4·Q6·Q7·Q8(접근성)

> ⚠️ C3는 백엔드 응답 스펙 확인이 선행되어야 정확히 수정 가능.
> ⚠️ A1·A2·A3은 공통 원인(shared가 도메인을 앎)이라 함께 묶어 리팩터링하는 것이 효율적.
