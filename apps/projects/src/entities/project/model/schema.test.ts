import { describe, expect, it } from 'vitest';

import { projectFormSchema } from './schema';

const validInput = {
  name: 'DataGSM',
  description: '학교 데이터를 제공하는 API 서비스',
  startYear: 2024,
  clubId: null,
  repositories: [],
  techStacks: [],
  iconKey: null,
};

describe('projectFormSchema', () => {
  it('유효한 입력을 통과시킨다', () => {
    expect(projectFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('이름이 비어 있으면 실패한다', () => {
    expect(projectFormSchema.safeParse({ ...validInput, name: '' }).success).toBe(false);
  });

  it('이름이 100자를 넘으면 실패한다', () => {
    expect(projectFormSchema.safeParse({ ...validInput, name: 'a'.repeat(101) }).success).toBe(
      false,
    );
  });

  it('시작 연도가 숫자가 아니면 실패한다', () => {
    expect(projectFormSchema.safeParse({ ...validInput, startYear: Number.NaN }).success).toBe(
      false,
    );
  });

  it('리포지토리가 20개를 초과하면 실패한다', () => {
    const repositories = Array.from({ length: 21 }, (_, index) => `https://repo/${index}`);
    expect(projectFormSchema.safeParse({ ...validInput, repositories }).success).toBe(false);
  });
});
