// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { PROJECT_CATEGORIES, getProjectCategoryLabel, parseProjectCategory } from './project';

describe('getProjectCategoryLabel', () => {
  it('카테고리를 한글 이름으로 바꾼다', () => {
    expect(PROJECT_CATEGORIES.map(getProjectCategoryLabel)).toEqual([
      '개인 프로젝트',
      '팀 프로젝트',
      '동아리 프로젝트',
      '아이디어페스티벌',
      '미배포 프로젝트',
    ]);
  });

  it.each([null, undefined])('%s는 미분류로 보여준다', (value) => {
    expect(getProjectCategoryLabel(value)).toBe('미분류');
  });
});

describe('parseProjectCategory', () => {
  it.each(PROJECT_CATEGORIES)('목록에 있는 %s는 그대로 쓴다', (value) => {
    expect(parseProjectCategory(value)).toBe(value);
  });

  it.each([null, undefined, '', 'all'])('%s는 전체로 본다', (value) => {
    expect(parseProjectCategory(value)).toBeUndefined();
  });

  it.each(['foo', 'team', 'ACTIVE'])('목록에 없는 %s는 전체로 본다', (value) => {
    expect(parseProjectCategory(value)).toBeUndefined();
  });
});
