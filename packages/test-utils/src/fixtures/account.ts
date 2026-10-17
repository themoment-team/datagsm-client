import type { AccountListData, AccountListItem, MyAccount } from '@repo/shared/types';

import { nextId } from './sequence';
import { createStudent } from './student';

/** 기본값은 학생 정보가 연결된 활성 일반 계정이다. */
export const createAccountListItem = (
  overrides: Partial<AccountListItem> = {},
): AccountListItem => {
  const id = overrides.id ?? nextId();
  const student = 'student' in overrides ? (overrides.student ?? null) : createStudent();

  return {
    id,
    email: student?.email ?? `account${id}@gsm.hs.kr`,
    role: 'USER',
    status: 'ACTIVE',
    objectType: student ? 'STUDENT' : null,
    student,
    teacher: null,
    createdAt: '2026-03-02T09:00:00',
    updatedAt: '2026-03-02T09:00:00',
    ...overrides,
  };
};

export const createAccountListData = (
  accounts: AccountListItem[] = [createAccountListItem()],
  overrides: Partial<AccountListData> = {},
): AccountListData => ({
  totalPages: 1,
  totalElements: accounts.length,
  accounts,
  ...overrides,
});

/** `GET /v1/accounts/my` 응답. 기본값은 학생 계정이다. */
export const createMyAccount = (overrides: Partial<MyAccount> = {}): MyAccount => {
  const id = overrides.id ?? nextId();
  const student = 'student' in overrides ? overrides.student : createStudent();

  return {
    id,
    email: student?.email ?? `account${id}@gsm.hs.kr`,
    role: 'USER',
    status: 'ACTIVE',
    objectType: student ? 'STUDENT' : null,
    student,
    ...overrides,
  };
};
