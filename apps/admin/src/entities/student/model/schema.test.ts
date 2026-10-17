// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AddStudentSchema } from './schema';

const validStudent = {
  name: '홍길동',
  sex: 'MAN',
  email: 's25001@gsm.hs.kr',
  grade: 2,
  classNum: 1,
  number: 3,
  role: 'GENERAL_STUDENT',
  dormitoryRoomNumber: 305,
  specialty: null,
  githubId: null,
  majorClubId: null,
  autonomousClubId: null,
};

const issuesOf = (input: object) => {
  const result = AddStudentSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.reverse().map((issue) => [issue.path.join('.'), issue.message]),
      );
};

describe('AddStudentSchema', () => {
  it('동아리가 없는 학생도 통과한다', () => {
    expect(issuesOf(validStudent)).toEqual({});
  });

  it('선택하지 않은 항목은 항목별로 안내한다', () => {
    expect(
      issuesOf({
        ...validStudent,
        name: '',
        sex: undefined,
        grade: undefined,
        classNum: undefined,
        number: undefined,
        role: undefined,
      }),
    ).toMatchObject({
      name: '이름을 입력해주세요.',
      sex: '성별을 선택해주세요.',
      grade: '학년을 선택해주세요.',
      classNum: '반을 선택해주세요.',
      number: '번호를 선택해주세요.',
      role: '구분을 선택해주세요.',
    });
  });

  it('이메일 형식을 검사한다', () => {
    expect(issuesOf({ ...validStudent, email: 's25001' }).email).toBe(
      '올바른 이메일 형식이 아닙니다.',
    );
  });

  it.each([
    [200, '201호 이상으로 입력해주세요.'],
    [519, '518호 이하로 입력해주세요.'],
    [undefined, '호실을 입력해주세요.'],
  ])('호실 %s는 거부한다', (dormitoryRoomNumber, message) => {
    expect(issuesOf({ ...validStudent, dormitoryRoomNumber }).dormitoryRoomNumber).toBe(message);
  });

  it('동아리 ID는 1 이상이어야 한다', () => {
    expect(issuesOf({ ...validStudent, majorClubId: 0 })).toHaveProperty('majorClubId');
    expect(issuesOf({ ...validStudent, majorClubId: 3, autonomousClubId: 7 })).toEqual({});
  });

  it('전공은 비워 둘 수 있지만 빈 문자열은 거부한다', () => {
    expect(issuesOf({ ...validStudent, specialty: undefined })).toEqual({});
    expect(issuesOf({ ...validStudent, specialty: '' }).specialty).toBe('전공을 입력해주세요.');
  });
});
