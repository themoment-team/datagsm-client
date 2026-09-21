import type {
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
