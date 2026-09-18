// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getSignUpFormSchema } from './schema';

const validStudent = {
  email: 's25001@gsm.hs.kr',
  password: 'password1',
  confirmPassword: 'password1',
  code: 'ABCD1234',
  privacyAgreed: true,
};

const issuesOf = (objectType: 'STUDENT' | 'TEACHER', input: object) => {
  const result = getSignUpFormSchema(objectType).safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(
        // 한 경로에 에러가 여러 개면 사용자에게 먼저 보이는 첫 번째만 남긴다.
        result.error.issues.reverse().map((issue) => [issue.path.join('.'), issue.message]),
      );
};

describe('학생 회원가입 스키마', () => {
  it('필수 값이 모두 맞으면 통과한다', () => {
    expect(issuesOf('STUDENT', validStudent)).toEqual({});
  });

  it.each([
    ['short1', '비밀번호는 최소 8자 이상이어야 합니다.'],
    ['onlyletters', '비밀번호는 영문과 숫자를 포함해야 합니다.'],
    ['12345678', '비밀번호는 영문과 숫자를 포함해야 합니다.'],
    ['a1' + 'x'.repeat(99), '비밀번호는 최대 100자 이하여야 합니다.'],
  ])('비밀번호 %s는 거부한다', (password, message) => {
    const issues = issuesOf('STUDENT', { ...validStudent, password, confirmPassword: password });

    expect(issues.password).toBe(message);
  });

  it('비밀번호 확인이 다르면 confirmPassword에 에러를 단다', () => {
    expect(issuesOf('STUDENT', { ...validStudent, confirmPassword: 'password2' })).toEqual({
      confirmPassword: '비밀번호가 일치하지 않습니다.',
    });
  });

  it('인증 코드는 8자리여야 한다', () => {
    expect(issuesOf('STUDENT', { ...validStudent, code: '1234567' }).code).toBe(
      '인증 코드는 8자리입니다.',
    );
  });

  it('개인정보 처리방침에 동의하지 않으면 거부한다', () => {
    expect(issuesOf('STUDENT', { ...validStudent, privacyAgreed: false }).privacyAgreed).toBe(
      '개인정보 처리방침에 동의해주세요.',
    );
  });
});

describe('선생님 회원가입 스키마', () => {
  it('성함과 소속 부서가 있으면 통과한다', () => {
    expect(issuesOf('TEACHER', { ...validStudent, name: '김선생', department: 'MEISTER' })).toEqual(
      {},
    );
  });

  it('공백뿐인 성함과 빠진 부서를 거부한다', () => {
    expect(issuesOf('TEACHER', { ...validStudent, name: '   ' })).toEqual({
      name: '성함을 입력해주세요.',
      department: '소속 부서를 선택해주세요.',
    });
  });

  it('성함 10자, 설명 100자를 넘으면 거부한다', () => {
    const issues = issuesOf('TEACHER', {
      ...validStudent,
      name: '가'.repeat(11),
      department: 'MEISTER',
      description: '가'.repeat(101),
    });

    expect(issues).toMatchObject({
      name: '성함은 최대 10자 이하여야 합니다.',
      description: '설명은 최대 100자 이하여야 합니다.',
    });
  });

  it('목록에 없는 부서는 거부한다', () => {
    const issues = issuesOf('TEACHER', { ...validStudent, name: '김선생', department: 'UNKNOWN' });

    expect(issues).toHaveProperty('department');
  });
});
