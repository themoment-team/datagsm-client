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

/** 카테고리가 없는(null) 프로젝트는 미분류로 보여준다. */
export const getProjectCategoryLabel = (category: ProjectCategory | null | undefined) =>
  category ? PROJECT_CATEGORY_LABEL[category] : PROJECT_UNCATEGORIZED_LABEL;

/**
 * URL의 category 값을 카테고리로 바꾼다. 목록에 없는 값은 전체(undefined)로 본다.
 * 검증 없이 넘기면 `?category=foo`가 그대로 서버로 가 400이 난다.
 */
export const parseProjectCategory = (value: string | null | undefined) =>
  PROJECT_CATEGORIES.find((category) => category === value);
