import type {
  ProjectIconContentType,
  ProjectRequestStatus,
  ProjectSortBy,
  ProjectSortDirection,
  ProjectStatus,
  StudentMajor,
} from '@repo/shared/types';
import type { FilterOption } from '@repo/shared/ui';

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: '운영 중',
  ENDED: '종료',
};

export const PROJECT_REQUEST_STATUS_LABEL: Record<ProjectRequestStatus, string> = {
  PENDING: '심사 중',
  ACCEPTED: '승인됨',
  REJECTED: '거절됨',
};

export const STUDENT_MAJOR_LABEL: Record<StudentMajor, string> = {
  SW_DEVELOPMENT: '소프트웨어개발과',
  SMART_IOT: '스마트IoT과',
  AI: '인공지능과',
};

export const PROJECT_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: '전체' },
  { value: 'ACTIVE', label: '운영 중' },
  { value: 'ENDED', label: '종료' },
];

export const PROJECT_REQUEST_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '심사 중' },
  { value: 'ACCEPTED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
];

export const PROJECT_SORT_OPTIONS: FilterOption[] = [
  { value: 'ID:DESC', label: '최신순' },
  { value: 'ID:ASC', label: '오래된순' },
  { value: 'NAME:ASC', label: '이름 오름차순' },
  { value: 'NAME:DESC', label: '이름 내림차순' },
];

export const DEFAULT_PROJECT_SORT = 'ID:DESC';

export interface ProjectSortValue {
  sortBy: ProjectSortBy;
  sortDirection: ProjectSortDirection;
}

/** 'ID:DESC' 형태의 정렬 값을 sortBy/sortDirection으로 분해한다. */
export const parseProjectSort = (value: string | undefined): ProjectSortValue => {
  const [sortBy, sortDirection] = (value ?? DEFAULT_PROJECT_SORT).split(':');

  return {
    sortBy: (sortBy as ProjectSortBy) || 'ID',
    sortDirection: (sortDirection as ProjectSortDirection) || 'DESC',
  };
};

/* 신청 폼 제약 */
export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;
export const PROJECT_REPOSITORY_MAX_COUNT = 20;
export const PROJECT_REPOSITORY_MAX_LENGTH = 300;
export const PROJECT_TECH_STACK_MAX_COUNT = 20;
export const PROJECT_TECH_STACK_MAX_LENGTH = 50;
export const PROJECT_DEPLOYMENT_URL_MAX_LENGTH = 300;

/** 서버 검증(`^https?://.*`)과 같은 규칙. 서버는 대소문자를 구분하므로 `i` 플래그를 붙이지 않는다. */
export const PROJECT_DEPLOYMENT_URL_PATTERN = /^https?:\/\//;

/** 무소속을 의미하는 clubId */
export const NO_CLUB_ID = 0;

/* 아이콘 업로드 제약 */
export const PROJECT_ICON_ALLOWED_TYPES: ProjectIconContentType[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
export const PROJECT_ICON_MAX_SIZE = 5 * 1024 * 1024;
export const PROJECT_ICON_ACCEPT = PROJECT_ICON_ALLOWED_TYPES.join(',');
