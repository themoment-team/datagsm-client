import { describe, expect, it } from 'vitest';

import { DEFAULT_PROJECT_SORT, parseProjectSort } from './constants';

describe('parseProjectSort', () => {
  it('ID:DESC를 sortBy/sortDirection으로 분해한다', () => {
    expect(parseProjectSort('ID:DESC')).toEqual({ sortBy: 'ID', sortDirection: 'DESC' });
  });

  it('NAME:ASC를 sortBy/sortDirection으로 분해한다', () => {
    expect(parseProjectSort('NAME:ASC')).toEqual({ sortBy: 'NAME', sortDirection: 'ASC' });
  });

  it('값이 없으면 기본 정렬을 쓴다', () => {
    expect(parseProjectSort(undefined)).toEqual({ sortBy: 'ID', sortDirection: 'DESC' });
  });

  it('기본 정렬 상수도 동일하게 분해된다', () => {
    expect(parseProjectSort(DEFAULT_PROJECT_SORT)).toEqual({ sortBy: 'ID', sortDirection: 'DESC' });
  });
});
