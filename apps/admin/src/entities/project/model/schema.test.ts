// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AddProjectSchema } from './schema';

const activeProject = {
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2025,
  clubId: null,
  participantIds: [1],
  status: 'ACTIVE',
  repositories: [],
  techStacks: [],
};

const issuesOf = (input: object) => {
  const result = AddProjectSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.reverse().map((issue) => [issue.path.join('.'), issue.message]),
      );
};

describe('AddProjectSchema', () => {
  it('진행 중인 프로젝트는 종료 연도 없이 통과한다', () => {
    expect(issuesOf(activeProject)).toEqual({});
  });

  it('필수 값이 없으면 항목별로 안내한다', () => {
    expect(
      issuesOf({
        ...activeProject,
        name: '',
        description: '',
        startYear: undefined,
        participantIds: [],
      }),
    ).toMatchObject({
      name: '프로젝트명을 입력해주세요.',
      description: '프로젝트 설명을 입력해주세요.',
      startYear: '시작 연도를 입력해주세요.',
      participantIds: '한 명 이상의 팀원을 선택해주세요.',
    });
  });

  describe('종료된 프로젝트', () => {
    const endedProject = { ...activeProject, status: 'ENDED', endYear: 2026 };

    it('시작 연도 이후의 종료 연도가 있으면 통과한다', () => {
      expect(issuesOf(endedProject)).toEqual({});
      expect(issuesOf({ ...endedProject, endYear: 2025 })).toEqual({});
    });

    it('종료 연도가 없으면 거부한다', () => {
      expect(issuesOf({ ...endedProject, endYear: undefined })).toEqual({
        endYear: '종료 연도를 입력해주세요.',
      });
    });

    it('종료 연도가 시작 연도보다 이르면 거부한다', () => {
      expect(issuesOf({ ...endedProject, endYear: 2024 })).toEqual({
        endYear: '종료 연도는 시작 연도보다 크거나 같아야 합니다.',
      });
    });
  });

  describe('리포지토리·기술 스택', () => {
    it('리포지토리 URL은 300자, 기술 스택은 50자까지 받는다', () => {
      expect(
        issuesOf({
          ...activeProject,
          repositories: ['a'.repeat(301)],
          techStacks: ['b'.repeat(51)],
        }),
      ).toEqual({
        'repositories.0': '리포지토리 URL은 300자 이하로 입력해주세요.',
        'techStacks.0': '기술 스택은 50자 이하로 입력해주세요.',
      });
    });

    it('각각 20개까지 등록할 수 있다', () => {
      const items = (count: number) => Array.from({ length: count }, (_, i) => `item-${i}`);

      expect(
        issuesOf({ ...activeProject, repositories: items(20), techStacks: items(20) }),
      ).toEqual({});
      expect(
        issuesOf({ ...activeProject, repositories: items(21), techStacks: items(21) }),
      ).toEqual({
        repositories: '리포지토리는 최대 20개까지 등록할 수 있습니다.',
        techStacks: '기술 스택은 최대 20개까지 등록할 수 있습니다.',
      });
    });
  });
});
