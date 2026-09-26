# 프로젝트 API 명세 (개발 참고용)

> `apps/projects` 개발 시 참고하는 백엔드 API 명세입니다. Swagger: `{host}/swagger-ui/index.html`

## 서버 변경사항 (최신)

- **수정 시 생략한 값은 유지, 빈 문자열은 삭제** (server PR #452)
  - `iconKey`·`deploymentUrl`은 생략하거나 `null`이면 **원본 프로젝트의 현재 값을 유지**하고, `""`이면 삭제한다. 신청(2-4·2-5)과 어드민 수정(3-5) 모두 같다. 신규 신청은 원본이 없어 생략하면 `null`이다.
  - 응답(2-1, 3-1·3-2, 3-5 조회)에 `iconKey`가 추가됐다. 공개 조회(1-1·1-2)에는 없다.
  - 대기 중인 수정안을 다시 고치거나 신규 신청을 다시 낼 때 생략하면 화면에 보이던 값과 달라지므로, 보이는 값을 그대로 보낸다.
  - 수정 신청은 프로젝트당 1행을 상태와 무관하게 재사용한다(거절·승인 이력이 남지 않음). 신규 신청은 매번 새 행이다.
- **배포 URL 필드 추가** (server PR #451)
  - 요청(2-4·2-5·3-5)에 `deploymentUrl`, 응답(1-1·1-2·2-1·3-1·3-2)에 `deploymentUrl: string | null`이 추가됐다. 웹훅 `project.updated`에는 `deployment_url`로 실린다.
- **GET /v1/students/me/projects — 거절 상태 해석 (중요)**
  - 실제 서버 동작이 바뀐 유일한 항목. 나머지는 문서 정정.
  - 이미 등록된 프로젝트의 수정 신청이 거절되면, 이전엔 아무것도 안 내려갔는데 이제 원본 프로젝트에 거절 정보가 실려서 온다.
- **GET /v1/students/me/projects — 페이징 없음**
  - `page`/`size` 파라미터 없음. 조건에 맞는 전체 목록이 한 번에 오고 `totalElements`는 배열 길이와 같다. 무한스크롤 붙이지 말 것.
- **GET /v1/public/projects — 정렬 지정 필요**
  - `sortBy`를 안 보내면 순서가 보장되지 않는다. 페이지를 넘기며 조회할 땐 `sortBy=ID` 같은 값을 꼭 함께 보내야 중복·누락이 안 생긴다.
- **Rate limit 헤더 범위**
  - `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `Retry-After`는 공개 API(`/v1/public/**`) 응답에만 붙는다. 아이콘 업로드 URL 발급이 429로 막힐 땐 헤더 없이 일반 에러 형태로만 온다 — 남은 횟수 표시 UI는 공개 API 쪽에만 가능하다.

---

## 공통

### 응답 래핑

모든 응답은 아래 형태로 감싸진다. 이 문서의 응답 예시는 `data` 내부만 표기한다.

```json
{ "success": true, "status": 200, "message": "...", "data": { } }
```

### 인증

`Authorization: Bearer {accessToken}`

| 경로 | 권한 |
|---|---|
| `/v1/public/projects/**` | 불필요 (누구나) |
| `/v1/students/me/projects/**` | 로그인 학생 |
| `/v1/projects/**` | `ADMIN` / `ROOT` |

### 요청 제한

| 대상 | 기준 | 한도 | 초과 응답 | 헤더 |
|---|---|---|---|---|
| 공개 조회 (`/v1/public/**`) | IP | 60회 / 분 | `429` | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| 아이콘 URL 발급 | 계정 | 10회 / 분 | `429` | 없음 |

`X-RateLimit-*` 헤더는 **공개 API 응답에만** 포함된다 (성공·실패 모두).

### 공통 enum

| enum | 값 |
|---|---|
| `requestStatus` | `PENDING`(신청 대기 중) / `ACCEPTED`(수락) / `REJECTED`(거절) |
| `status` (운영 상태) | `ACTIVE`(운영 중) / `ENDED`(종료) |
| `role` | `OWNER`(신청자) / `PARTICIPANT`(참여자) |
| `club.type` | `MAJOR_CLUB`(전공동아리) / `AUTONOMOUS_CLUB`(창체동아리) |
| `major` | `SW_DEVELOPMENT` / `SMART_IOT` / `AI` |
| `sex` | `MAN` / `WOMAN` |

---

## 1. 공개 조회 (인증 불필요)

### 1-1. 프로젝트 목록 — `GET /v1/public/projects`

| 쿼리 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `projectName` | string | - | 이름 검색 (앞글자 우선, 없으면 부분일치) |
| `clubId` | number | - | 동아리 필터 |
| `status` | enum | - | 미입력 시 전체 |
| `page` | number | `0` | |
| `size` | number | `20` | 최대 100 |
| `sortBy` | enum | - | `ID` / `NAME` |
| `sortDirection` | enum | `ASC` | `ASC` / `DESC` |

> `sortBy`를 지정하지 않으면 정렬 순서가 보장되지 않는다. 페이지를 넘겨 조회할 때는 `sortBy=ID` 등을 함께 보내야 중복·누락이 생기지 않는다.

```json
{
  "totalPages": 3,
  "totalElements": 42,
  "projects": [
    {
      "id": 1,
      "name": "DataGSM 프로젝트",
      "description": "학교 데이터를 제공하는 API 서비스",
      "startYear": 2024,
      "endYear": null,
      "status": "ACTIVE",
      "iconUrl": "https://cdn.datagsm.kr/project-icons/{uuid}.png",
      "deploymentUrl": "https://datagsm.kr",
      "club": { "id": 1, "name": "SW개발동아리", "type": "MAJOR_CLUB" },
      "participants": [{ "name": "홍길동", "major": "SW_DEVELOPMENT" }],
      "repositories": ["https://github.com/team/repo"],
      "techStacks": ["Kotlin", "Spring Boot"]
    }
  ]
}
```

> 공개 응답의 `participants`에는 **이름과 학과만** 포함된다. 이메일·학번·ID는 내려가지 않는다.

### 1-2. 프로젝트 상세 — `GET /v1/public/projects/{projectId}`

응답: 위 `projects[]` 요소와 동일한 단일 객체. 에러: `404` 프로젝트를 찾을 수 없음.

---

## 2. 학생 API (로그인 필요)

### 2-1. 내 프로젝트 목록 — `GET /v1/students/me/projects`

본인이 **신청했거나 참여자로 등록된** 프로젝트를 상태와 함께 반환한다.

| 쿼리 | 타입 | 설명 |
|---|---|---|
| `requestStatus` | enum | 미입력 시 전체. 탭 필터에 사용 |

> 이 API는 **페이징이 없다**. 조건에 맞는 전체 목록을 한 번에 반환하며 `totalElements`는 배열 길이와 같다.

```json
{
  "totalElements": 2,
  "projects": [
    {
      "projectId": 10,
      "requestId": null,
      "requestStatus": "ACCEPTED",
      "rejectReason": null,
      "role": "OWNER",
      "name": "DataGSM 프로젝트",
      "description": "학교 데이터를 제공하는 API 서비스",
      "startYear": 2024,
      "endYear": null,
      "status": "ACTIVE",
      "iconUrl": "https://cdn.datagsm.kr/project-icons/{uuid}.png",
      "iconKey": "project-icons/{uuid}.png",
      "deploymentUrl": "https://datagsm.kr",
      "club": { "id": 1, "name": "SW개발동아리", "type": "MAJOR_CLUB" },
      "participants": [
        { "id": 1, "name": "홍길동", "email": "s24080@gsm.hs.kr", "studentNumber": 1201, "major": "SW_DEVELOPMENT", "sex": "MAN" }
      ],
      "repositories": ["https://github.com/team/repo"],
      "techStacks": ["Kotlin"]
    }
  ]
}
```

**필드 해석 규칙** (프론트 분기 기준)

| 상황 | `projectId` | `requestId` | `requestStatus` | 내용 기준 | 표시 |
|---|---|---|---|---|---|
| 승인 완료 | 값 | `null` | `ACCEPTED` | 원본 | 등록된 프로젝트 |
| 승인본 + 수정 심사중 | 값 | 값 | `PENDING` | **수정안** | 수정 심사 중 |
| 승인본 + 수정 거절됨 | 값 | 값 | `REJECTED` | **원본** | 등록된 프로젝트 + 거절 안내 |
| 신규 신청 심사중 | `null` | 값 | `PENDING` | 신청 내용 | 신청 대기 중 |
| 신규 신청 거절 | `null` | 값 | `REJECTED` | 신청 내용 | 거절 |

- `projectId`가 있으면 **이미 등록된 프로젝트**다. `requestStatus=REJECTED`여도 프로젝트 자체는 유효하며, 마지막 수정 신청이 거절됐다는 의미다.
- `projectId`가 `null`이면 아직 등록 전이므로, `REJECTED`는 등록 자체가 무산된 상태다.
- 대기 중인 수정안이 있으면 거절 이력보다 우선한다 (`PENDING`으로 표시).
- 승인된 프로젝트는 수정 심사 중이어도 **항상 1건으로만** 내려간다 (중복 없음).
- `status`(운영 상태)와 `endYear`는 승인 전이면 `null`이다.
- `role`은 **원본 프로젝트 소유자 기준**이다. 수정안 작성자가 누구든 소유자는 `OWNER`로 유지된다.

에러: `403` 학생 정보가 연결되지 않은 계정.

### 2-2. 아이콘 업로드 URL 발급 — `POST /v1/students/me/projects/icons/upload-url`

```json
{ "contentType": "image/png", "contentLength": 204800 }
```

| 필드 | 제약 |
|---|---|
| `contentType` | `image/png` / `image/jpeg` / `image/webp` / `image/gif` |
| `contentLength` | 최대 5,242,880 (5MB) |

```json
{ "uploadUrl": "https://{bucket}.s3.{region}.amazonaws.com/project-icons/{uuid}.png?X-Amz-...", "iconKey": "project-icons/{uuid}.png", "expiresInSeconds": 300 }
```

에러: `400` 지원하지 않는 형식 / 크기 초과, `429` 요청 제한 초과.

### 2-3. 아이콘 업로드 (S3 직접 호출)

발급받은 `uploadUrl`로 **서버를 거치지 않고** S3에 직접 PUT.

```
PUT {uploadUrl}
Content-Type: image/png          ← 발급 시 보낸 값과 반드시 동일
Content-Length: 204800           ← 발급 시 보낸 값과 반드시 동일
Body: <binary>
```

> `Content-Type`/`Content-Length`가 서명에 포함되어 있어 다르면 S3가 `403`으로 거부한다. `Authorization` 헤더는 붙이지 말 것. 성공 후 받은 `iconKey`를 신청 API의 `iconKey`로 전달한다.

### 2-4. 프로젝트 신청 (신규) — `POST /v1/students/me/projects`

```json
{ "name": "...", "description": "...", "startYear": 2024, "clubId": 1, "participantIds": [1,2,3], "repositories": ["..."], "techStacks": ["..."], "iconKey": "project-icons/{uuid}.png", "deploymentUrl": "https://datagsm.kr" }
```

| 필드 | 필수 | 제약 |
|---|---|---|
| `name` | O | 1~100자 |
| `description` | O | 1~500자 |
| `startYear` | O | 양수 |
| `clubId` | X | **무소속은 `0` 또는 생략** |
| `participantIds` | X | 기본 `[]` |
| `repositories` | X | 최대 20개, 각 300자 |
| `techStacks` | X | 최대 20개, 각 50자 |
| `iconKey` | X | 2-2에서 발급받은 값. 수정 시 생략하면 현재 값 유지, `""`이면 삭제 |
| `deploymentUrl` | X | 최대 300자, `http://` 또는 `https://`로 시작 (대소문자 구분). 수정 시 생략하면 현재 값 유지, `""`이면 삭제 |

응답: 신청 상세 (`ProjectEditRequestResDto`, `originalProjectId: null`). 에러: `400` 검증 실패, `404` 동아리/참여자를 찾을 수 없음.

### 2-5. 프로젝트 수정 신청 — `PUT /v1/students/me/projects/{projectId}`

요청 바디는 2-4와 동일.

- 상태(대기/수락/거절)와 무관하게 수정 신청 가능.
- **대기 중인 수정 신청이 있으면 최신 내용으로 대체**된다 (별도 삭제 불필요).
- **신청자와 참여자 모두** 수정 가능.
- 원본 프로젝트는 어드민 수락 시점에만 변경된다.
- `iconKey`·`deploymentUrl`은 생략하면 **원본 프로젝트의 현재 값**을 유지하고 `""`이면 삭제한다. 대기 중인 수정안은 원본과 값이 다를 수 있으니 화면에 보이는 값을 그대로 보낸다.

응답: 2-4와 동일 (`originalProjectId`에 값 존재). 에러: `400` 검증 실패, `403` 수정 권한 없음, `404` 프로젝트/동아리/참여자를 찾을 수 없음.

---

## 3. 어드민 API (`ADMIN` / `ROOT`)

### 3-1. 신청 목록 — `GET /v1/projects/requests`

| 쿼리 | 타입 | 기본값 |
|---|---|---|
| `requestStatus` | enum | `PENDING` |
| `page` | number | `0` |
| `size` | number | `100` (최대 1000) |

응답: `{ totalPages, totalElements, requests: [ /* 2-4 응답과 동일한 객체 배열 */ ] }`. 최신 신청순(`requestedAt DESC`) 정렬.

### 3-2. 신청 상세 — `GET /v1/projects/requests/{requestId}`

응답: 2-4와 동일. 에러: `404` 신청 내역을 찾을 수 없음.

### 3-3. 신청 수락 — `POST /v1/projects/requests/{requestId}/accept`

요청 바디 없음. 신청 내용이 공식 프로젝트 데이터에 반영된다.

- `originalProjectId`가 `null`이면 **새 프로젝트 생성**
- 값이 있으면 **해당 프로젝트 갱신** (운영 상태·종료 연도는 보존)

응답: 반영된 프로젝트 (`ProjectResDto`). 에러: `404` 신청 내역 없음, `409` 이미 처리된 신청 / 중복된 프로젝트 이름.

### 3-4. 신청 거절 — `POST /v1/projects/requests/{requestId}/reject`

```json
{ "reason": "리포지토리 링크가 유효하지 않습니다." }
```

| 필드 | 필수 | 제약 |
|---|---|---|
| `reason` | O | 1~500자 |

기존 프로젝트 데이터는 변경되지 않고, 신청자가 2-1 조회 시 `rejectReason`으로 확인한다. 응답 `data`: 없음. 에러: `400` 사유 누락, `404` 신청 내역 없음, `409` 이미 처리된 신청.

### 3-5. 기존 프로젝트 직접 관리 (승인 절차 없이 어드민 직접 조작)

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/v1/projects` | 목록 조회 (기본 `status=ACTIVE`) |
| `POST` | `/v1/projects` | 직접 생성 |
| `PUT` | `/v1/projects/{projectId}` | 직접 수정 |
| `DELETE` | `/v1/projects/{projectId}` | 삭제 (신청 이력도 함께 정리) |
| `POST` | `/v1/projects/{projectId}/end` | 종료 처리 (`endYear` 필요) |
| `POST` | `/v1/projects/{projectId}/reactivate` | 운영 재개 |

`POST`/`PUT` 바디는 2-4 필드에 `status`, `endYear`가 추가된 형태. `iconKey`·`deploymentUrl`은 생략하면 현재 값 유지, `""`이면 삭제.

> **주의**: 어드민 API는 `clubId=0`을 무소속으로 해석하지 않는다. 무소속으로 만들려면 `clubId`를 **생략하거나 `null`**로 보내야 하며, `0`을 보내면 `404`가 발생한다. (`clubId=0` → 무소속 변환은 학생 신청 API에만 적용.)

---

## 4. 화면 구현 가이드

### 프로젝트 신청 팝업

1. 동아리 목록: `GET /v1/clubs?type=MAJOR_CLUB` (무소속 선택 시 `clubId: 0` 전송)
2. 참여자 검색: `GET /v1/students` (어드민 전용이므로, 학생용 참여자 선택 UI는 백엔드 협의 필요)
3. 아이콘: 2-2로 URL 발급 → 2-3으로 S3 직접 업로드 → `iconKey` 확보
4. 제출: 2-4 (신규) 또는 2-5 (수정)

### 내 프로젝트 목록 화면

`GET /v1/students/me/projects` 1회 호출 후 `requestStatus`로 탭을 나누거나, 탭 전환 시 `?requestStatus=`를 붙여 재호출한다.

- 거절 탭: `rejectReason` 노출
- 수정 버튼: 모든 상태에서 활성화, 클릭 시 2-5 호출
- `PENDING` 표시 시 "수정 심사 중" 배지 + 내용은 수정안 기준으로 렌더링

### 미결정 사항

학생이 참여자를 선택할 때 사용할 학생 검색 API가 아직 없다. 현재 `GET /v1/students`는 `ADMIN`/`ROOT` 전용이므로, 학생용 검색 엔드포인트 추가가 필요하다.

---

## 부록: 설계 배경 (수정 요청 = 별도 스냅샷 테이블)

- `tb_project`: 항상 "현재 공식 승인본"만 보관. 기존 어드민 CRUD 대상 그대로.
- `tb_project_edit_request`: 신청/수정 제안 스냅샷 보관.
  - `original_project_id`가 `NULL` → 신규 생성 신청 / 값 존재 → 해당 프로젝트 수정 신청
  - 수락 시 스냅샷을 `tb_project`에 반영(신규 INSERT, 수정 UPDATE)하고 요청 row는 `ACCEPTED`로 마킹
  - 거절 시 `tb_project`는 불변, 요청 row에 사유만 기록
  - 수정 신청은 프로젝트당 1행만 유지 — 상태와 무관하게 재신청 시 기존 행을 최신 내용으로 덮어쓴다(거절·승인 이력은 남지 않음). 신규 신청은 매번 새 행
- `tb_project`에 최초 신청자 추적용 `applied_by_id`와 아이콘 키 `icon_key` 컬럼 추가. 어드민이 직접 생성한 프로젝트는 `applied_by_id`가 `NULL`.

### 아이콘 업로드 설계

- S3 버킷은 비공개, CloudFront + OAC로만 조회. 업로드는 presigned PUT URL로 클라이언트가 S3에 직접(서버는 파일 바이트 미경유).
- MIME 화이트리스트(`png`/`jpeg`/`webp`/`gif`, SVG 제외), 5MB 상한, 서버 생성 UUID 키, 5분 만료.
- 조회는 DB에 키만 저장하고 응답 시 CDN 도메인 조합해 URL 생성 (만료 없음 → 캐시 정상 동작).

### 추후 작업 (이번 범위 제외)

- 신청 발생 시 어드민 디스코드 알림
- 학생용 참여자 검색 API (현재 `GET /v1/students`는 어드민 전용)
