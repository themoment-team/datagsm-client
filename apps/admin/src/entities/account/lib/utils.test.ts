// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getAccountObjectTypeLabel, getAccountRoleLabel, getAccountStatusLabel } from './utils';

describe('계정 라벨', () => {
  it.each([
    ['ROOT', '루트'],
    ['ADMIN', '어드민'],
    ['USER', '유저'],
  ] as const)('권한 %s는 %s로 보여준다', (role, label) => {
    expect(getAccountRoleLabel(role)).toBe(label);
  });

  it('연결된 대상이 없으면 미연동으로 보여준다', () => {
    expect(getAccountObjectTypeLabel('STUDENT')).toBe('학생');
    expect(getAccountObjectTypeLabel('TEACHER')).toBe('선생님');
    expect(getAccountObjectTypeLabel(null)).toBe('미연동');
  });

  it('상태를 승인대기·활성으로 보여준다', () => {
    expect(getAccountStatusLabel('PENDING')).toBe('승인대기');
    expect(getAccountStatusLabel('ACTIVE')).toBe('활성');
  });
});
