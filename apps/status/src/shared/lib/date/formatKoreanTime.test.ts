// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatKoreanTime } from './formatKoreanTime';

describe('formatKoreanTime', () => {
  it('실행 환경의 시간대와 관계없이 한국 시간 오전·오후 표기로 보여준다', () => {
    expect(formatKoreanTime(new Date('2026-03-02T00:05:09Z'))).toBe('오전 9:05:09');
    expect(formatKoreanTime(new Date('2026-03-02T05:30:00Z'))).toBe('오후 2:30:00');
  });
});
