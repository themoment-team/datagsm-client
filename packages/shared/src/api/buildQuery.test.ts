// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildQuery } from './buildQuery';

describe('buildQuery', () => {
  it('값이 없으면 빈 문자열을 돌려준다', () => {
    expect(buildQuery({})).toBe('');
    expect(buildQuery({ a: undefined, b: null, c: '' })).toBe('');
  });

  it('undefined, null, 빈 문자열은 빼고 넘긴 순서대로 넣는다', () => {
    expect(buildQuery({ b: 'x', a: undefined, c: null, d: '', e: 'y' })).toBe('?b=x&e=y');
  });

  it('0과 false는 값으로 보고 넣는다', () => {
    expect(buildQuery({ page: 0, isExpired: false })).toBe('?page=0&isExpired=false');
  });

  it('값을 URL 인코딩한다', () => {
    expect(buildQuery({ name: '홍 길동' })).toBe('?name=%ED%99%8D+%EA%B8%B8%EB%8F%99');
  });
});
