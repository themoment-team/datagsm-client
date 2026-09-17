import {
  act,
  mockRouter,
  renderHook,
  setMockPathname,
  setMockSearchParams,
} from '@repo/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { useURLFilters } from './useURLFilters';

interface Filters {
  grade?: string | number;
  classNum?: string;
  name?: string;
  onlyEnrolled?: boolean;
}

const renderFilters = () => renderHook(() => useURLFilters<Filters>()).result;

const pushedUrl = () => mockRouter.push.mock.lastCall?.[0];

describe('useURLFilters', () => {
  beforeEach(() => {
    setMockPathname('/students');
  });

  it('필터를 쿼리에 넣어 스크롤 없이 이동한다', () => {
    const result = renderFilters();

    act(() => result.current.updateURL({ grade: '2', name: '홍길동' }));

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/students?grade=2&name=%ED%99%8D%EA%B8%B8%EB%8F%99',
      { scroll: false },
    );
  });

  it('기존 쿼리는 유지하고 같은 키는 새 값으로 바꾼다', () => {
    setMockSearchParams('grade=1&classNum=3');
    const result = renderFilters();

    act(() => result.current.updateURL({ grade: '2' }));

    expect(pushedUrl()).toBe('/students?grade=2&classNum=3');
  });

  it("'all'과 빈 값은 쿼리에서 지운다", () => {
    setMockSearchParams('grade=1&classNum=3&name=kim');
    const result = renderFilters();

    act(() => result.current.updateURL({ grade: 'all', classNum: '', name: undefined }));

    expect(pushedUrl()).toBe('/students?');
  });

  // 0과 false도 빈 값으로 보고 지운다. 현재 동작을 기록한다.
  it('0과 false도 쿼리에서 지운다', () => {
    setMockSearchParams('grade=1&onlyEnrolled=true');
    const result = renderFilters();

    act(() => result.current.updateURL({ grade: 0, onlyEnrolled: false }));

    expect(pushedUrl()).toBe('/students?');
  });

  it('page가 0이면 지우고, 그 외에는 넣는다', () => {
    setMockSearchParams('page=3');
    const result = renderFilters();

    act(() => result.current.updateURL({}, 0));
    expect(pushedUrl()).toBe('/students?');

    act(() => result.current.updateURL({}, 4));
    expect(pushedUrl()).toBe('/students?page=4');
  });

  it('page를 넘기지 않으면 기존 page를 유지한다', () => {
    setMockSearchParams('page=3');
    const result = renderFilters();

    act(() => result.current.updateURL({ grade: '1' }));

    expect(pushedUrl()).toBe('/students?page=3&grade=1');
  });
});
