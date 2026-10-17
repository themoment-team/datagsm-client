// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getAfterColon } from './string';

describe('getAfterColon', () => {
  it('첫 번째 콜론 뒤의 내용을 앞뒤 공백 없이 돌려준다', () => {
    expect(getAfterColon('DataGSM: 학생 정보 조회')).toBe('학생 정보 조회');
  });

  it('뒤쪽 콜론은 그대로 둔다', () => {
    expect(getAfterColon('App:시간 10:30')).toBe('시간 10:30');
  });

  it('콜론이 없으면 원본을 그대로 돌려준다', () => {
    expect(getAfterColon(' 설명 ')).toBe(' 설명 ');
  });

  it('콜론 뒤가 비어 있으면 빈 문자열을 돌려준다', () => {
    expect(getAfterColon('App:')).toBe('');
  });
});
