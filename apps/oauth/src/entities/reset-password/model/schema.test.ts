// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { ResetPasswordFormSchema } from './schema';

const valid = {
  email: 's25001@gsm.hs.kr',
  code: 'ABCD1234',
  password: 'newpass12',
  confirmPassword: 'newpass12',
};

const issuesOf = (input: object) => {
  const result = ResetPasswordFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(
        // 한 경로에 에러가 여러 개면 사용자에게 먼저 보이는 첫 번째만 남긴다.
        result.error.issues.reverse().map((issue) => [issue.path.join('.'), issue.message]),
      );
};

describe('ResetPasswordFormSchema', () => {
  it('올바른 값은 통과한다', () => {
    expect(issuesOf(valid)).toEqual({});
  });

  it('이메일과 인증 코드가 비어 있으면 거부한다', () => {
    expect(issuesOf({ ...valid, email: '', code: '' })).toMatchObject({
      email: '이메일을 입력해주세요.',
      code: '인증 코드를 입력해주세요.',
    });
  });

  it('새 비밀번호는 영문과 숫자를 모두 포함해야 한다', () => {
    expect(issuesOf({ ...valid, password: 'abcdefgh', confirmPassword: 'abcdefgh' }).password).toBe(
      '비밀번호는 영문과 숫자를 포함해야 합니다.',
    );
  });

  it('비밀번호 확인이 다르면 confirmPassword에 에러를 단다', () => {
    expect(issuesOf({ ...valid, confirmPassword: 'other123' })).toEqual({
      confirmPassword: '비밀번호가 일치하지 않습니다.',
    });
  });
});
