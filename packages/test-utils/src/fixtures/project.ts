import type { Project, ProjectListData } from '@repo/shared/types';

import { nextId } from './sequence';

/** 기본값은 동아리·참여자·리포지토리·기술 스택이 없는 진행 중인 프로젝트다. */
export const createProject = (overrides: Partial<Project> = {}): Project => {
  const id = overrides.id ?? nextId();

  return {
    id,
    name: `프로젝트${id}`,
    description: `프로젝트${id} 설명`,
    startYear: 2025,
    endYear: null,
    status: 'ACTIVE',
    club: null,
    participants: [],
    repositories: [],
    techStacks: [],
    ...overrides,
  };
};

export const createProjectListData = (
  projects: Project[] = [createProject()],
  overrides: Partial<ProjectListData> = {},
): ProjectListData => ({
  totalPages: 1,
  totalElements: projects.length,
  projects,
  ...overrides,
});
