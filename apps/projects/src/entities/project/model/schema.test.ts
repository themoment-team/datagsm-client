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
  deploymentUrl: '',
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

  describe('deploymentUrl', () => {
    const parseUrl = (deploymentUrl: string) =>
      projectFormSchema.safeParse({ ...validInput, deploymentUrl });

    it.each(['https://datagsm.kr', 'http://localhost:3000/path?q=1'])('%s를 통과시킨다', (url) => {
      expect(parseUrl(url).success).toBe(true);
    });

    it('앞뒤 공백을 제거한 값으로 통과시킨다', () => {
      const result = parseUrl('  https://datagsm.kr  ');

      expect(result.success).toBe(true);
      expect(result.data?.deploymentUrl).toBe('https://datagsm.kr');
    });

    it('공백만 입력하면 미입력으로 본다', () => {
      const result = parseUrl('   ');

      expect(result.success).toBe(true);
      expect(result.data?.deploymentUrl).toBe('');
    });

    it.each([
      'javascript:alert(1)',
      'ftp://datagsm.kr',
      'datagsm.kr',
      // 서버 정규식은 대소문자를 구분한다
      'HTTPS://datagsm.kr',
    ])('%s는 실패한다', (url) => {
      expect(parseUrl(url).success).toBe(false);
    });

    it('300자를 넘으면 실패한다', () => {
      const prefix = 'https://';
      const atLimit = prefix + 'a'.repeat(300 - prefix.length);

      expect(parseUrl(atLimit).success).toBe(true);
      expect(parseUrl(`${atLimit}a`).success).toBe(false);
    });
  });
});
