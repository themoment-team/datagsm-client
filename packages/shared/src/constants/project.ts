import type { ProjectCategory } from '@repo/shared/types';

/** 서버의 배포 URL 길이 제한 */
export const PROJECT_DEPLOYMENT_URL_MAX_LENGTH = 300;

/** 서버 ProjectCategory와 이름·순서가 같아야 한다. 필터와 선택지에 이 순서로 보여준다. */
export const PROJECT_CATEGORIES = [
  'TOY_PROJECT',
  'TEAM',
  'CLUB',
  'IDEA_FESTIVAL',
  'NOT_DEPLOYED',
] as const satisfies readonly ProjectCategory[];

/** 프로젝트·어드민 양쪽 화면에서 같은 이름으로 보여준다. */
export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  TOY_PROJECT: '토이 프로젝트',
  TEAM: '팀 프로젝트',
  CLUB: '동아리 프로젝트',
  IDEA_FESTIVAL: '아이디어페스티벌',
  NOT_DEPLOYED: '미배포',
};

export const PROJECT_UNCATEGORIZED_LABEL = '미분류';

/**
 * 두 앱이 함께 쓰는 카테고리 필터 선택지. 'all'은 FilterSelect와 useURLFilters가 전체로 보는 값이다.
 * 서버가 미분류만 조회하는 방법을 주지 않아 미분류 선택지는 없다.
 */
export const PROJECT_CATEGORY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  ...PROJECT_CATEGORIES.map((category) => ({
    value: category,
    label: PROJECT_CATEGORY_LABEL[category],
  })),
];

/**
 * 프로젝트의 카테고리 이름 목록. 카테고리가 하나도 없으면 미분류 하나만 돌려준다.
 * 카테고리를 지원하기 전 서버는 categories를 내려주지 않으므로 없는 값도 미분류로 본다.
 */
export const getProjectCategoryLabels = (
  categories: readonly ProjectCategory[] | null | undefined,
) =>
  categories?.length
    ? categories.map((category) => PROJECT_CATEGORY_LABEL[category])
    : [PROJECT_UNCATEGORIZED_LABEL];

/**
 * URL의 category 값을 카테고리로 바꾼다. 목록에 없는 값은 전체(undefined)로 본다.
 * 검증 없이 넘기면 `?category=foo`가 그대로 서버로 가 400이 난다.
 */
export const parseProjectCategory = (value: string | null | undefined) =>
  PROJECT_CATEGORIES.find((category) => category === value);
