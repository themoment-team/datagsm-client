import { describe, expect, it } from 'vitest';

import { DEFAULT_PROJECT_SORT, parseProjectRequestStatus, parseProjectSort } from './constants';

describe('parseProjectRequestStatus', () => {
  it.each(['PENDING', 'ACCEPTED', 'REJECTED'] as const)(
    '필터 목록에 있는 %s는 그대로 쓴다',
    (value) => {
      expect(parseProjectRequestStatus(value)).toBe(value);
    },
  );

  it.each([null, undefined, '', 'all'])('%s는 전체로 본다', (value) => {
    expect(parseProjectRequestStatus(value)).toBeUndefined();
  });

  it.each(['foo', 'pending', 'ACTIVE'])('필터 목록에 없는 %s는 전체로 본다', (value) => {
    expect(parseProjectRequestStatus(value)).toBeUndefined();
  });
});

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
