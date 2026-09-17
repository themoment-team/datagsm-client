// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AddClubSchema } from './schema';

const activeClub = {
  name: '더모먼트',
  type: 'MAJOR_CLUB',
  status: 'ACTIVE',
  foundedYear: 2021,
  abolishedYear: null,
  leaderId: 1,
  participantIds: [2],
};

const issuesOf = (input: object) => {
  const result = AddClubSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.reverse().map((issue) => [issue.path.join('.'), issue.message]),
      );
};

describe('AddClubSchema', () => {
  it('운영 중인 동아리는 부장과 팀원이 있으면 통과한다', () => {
    expect(issuesOf(activeClub)).toEqual({});
  });

  it('필수 값이 없으면 항목별로 안내한다', () => {
    expect(
      issuesOf({
        ...activeClub,
        name: '',
        type: undefined,
        status: undefined,
        foundedYear: undefined,
      }),
    ).toMatchObject({
      name: '동아리명을 입력해주세요.',
      type: '동아리 종류를 선택해주세요.',
      status: '운영 상태를 선택해주세요.',
      foundedYear: '설립연도를 입력해주세요.',
    });
  });

  it('설립연도는 1900년 이후여야 한다', () => {
    expect(issuesOf({ ...activeClub, foundedYear: 1899 }).foundedYear).toBe(
      '1900년 이후의 연도를 입력해주세요.',
    );
  });

  it('운영 중인 동아리는 부장과 한 명 이상의 팀원이 있어야 한다', () => {
    expect(issuesOf({ ...activeClub, leaderId: undefined, participantIds: [] })).toEqual({
      leaderId: '동아리 부장을 선택해주세요.',
      participantIds: '한 명 이상의 팀원을 선택해주세요.',
    });
  });

  describe('폐지된 동아리', () => {
    const abolishedClub = {
      ...activeClub,
      status: 'ABOLISHED',
      leaderId: undefined,
      participantIds: [],
      abolishedYear: 2024,
    };

    it('부장과 팀원이 없어도 폐지연도가 있으면 통과한다', () => {
      expect(issuesOf(abolishedClub)).toEqual({});
    });

    it('폐지연도가 없으면 거부한다', () => {
      expect(issuesOf({ ...abolishedClub, abolishedYear: null })).toEqual({
        abolishedYear: '폐지연도를 입력해주세요.',
      });
    });

    it.each([1899, 2024.5])('폐지연도 %s는 거부한다', (abolishedYear) => {
      expect(issuesOf({ ...abolishedClub, abolishedYear })).toEqual({
        abolishedYear: '1900년 이후의 연도를 입력해주세요.',
      });
    });

    // 설립보다 이른 폐지연도를 막지 않는다. 현재 동작을 기록한다.
    it('설립연도보다 이른 폐지연도도 통과한다', () => {
      expect(issuesOf({ ...abolishedClub, foundedYear: 2024, abolishedYear: 2020 })).toEqual({});
    });
  });
});
