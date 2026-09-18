// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatDate, minutesToMs } from './date';

describe('minutesToMs', () => {
  it('분을 밀리초로 바꾼다', () => {
    expect(minutesToMs(5)).toBe(300_000);
    expect(minutesToMs(0)).toBe(0);
  });
});

describe('formatDate', () => {
  // 시간대에 따라 날짜가 바뀌지 않도록 로컬 시각으로 만든다.
  it('Date를 한국어 연·월·일로 표시한다', () => {
    expect(formatDate(new Date(2026, 2, 2))).toBe('2026년 3월 2일');
  });

  it('시간대 표기가 없는 날짜 문자열도 받는다', () => {
    expect(formatDate('2026-12-31T23:00:00')).toBe('2026년 12월 31일');
  });
});
