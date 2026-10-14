// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_FILTER_OPTIONS,
  getProjectCategoryLabels,
  parseProjectCategory,
} from './project';

describe('getProjectCategoryLabels', () => {
  it('카테고리마다 한글 이름을 받은 순서대로 돌려준다', () => {
    expect(getProjectCategoryLabels(PROJECT_CATEGORIES)).toEqual([
      '토이 프로젝트',
      '팀 프로젝트',
      '동아리 프로젝트',
      '아이디어페스티벌',
      '미배포',
    ]);
    expect(getProjectCategoryLabels(['NOT_DEPLOYED', 'TEAM'])).toEqual(['미배포', '팀 프로젝트']);
  });

  it.each([[[]], [null], [undefined]])('%j는 미분류 하나로 돌려준다', (categories) => {
    expect(getProjectCategoryLabels(categories)).toEqual(['미분류']);
  });
});

describe('PROJECT_CATEGORY_FILTER_OPTIONS', () => {
  it('전체 다음에 카테고리를 선언 순서대로 두고, 미분류 선택지는 두지 않는다', () => {
    expect(PROJECT_CATEGORY_FILTER_OPTIONS.map(({ value }) => value)).toEqual([
      'all',
      ...PROJECT_CATEGORIES,
    ]);
    expect(PROJECT_CATEGORY_FILTER_OPTIONS.map(({ label }) => label)).not.toContain('미분류');
  });
});

describe('parseProjectCategory', () => {
  it.each(PROJECT_CATEGORIES)('목록에 있는 %s는 그대로 쓴다', (value) => {
    expect(parseProjectCategory(value)).toBe(value);
  });

  it.each([null, undefined, '', 'all'])('%s는 전체로 본다', (value) => {
    expect(parseProjectCategory(value)).toBeUndefined();
  });

  it.each(['foo', 'team', 'ACTIVE', 'PERSONAL'])('목록에 없는 %s는 전체로 본다', (value) => {
    expect(parseProjectCategory(value)).toBeUndefined();
  });
});
