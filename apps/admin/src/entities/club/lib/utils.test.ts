// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getStatusLabel, getTypeLabel } from './utils';

describe('동아리 라벨', () => {
  it('종류와 운영 상태를 보여주고, 모르는 값은 -로 보여준다', () => {
    expect(getTypeLabel('MAJOR_CLUB')).toBe('전공');
    expect(getTypeLabel('AUTONOMOUS_CLUB')).toBe('자율');
    expect(getTypeLabel('UNKNOWN' as never)).toBe('-');
    expect(getStatusLabel('ACTIVE')).toBe('운영 중');
    expect(getStatusLabel('ABOLISHED')).toBe('폐지');
    expect(getStatusLabel('UNKNOWN' as never)).toBe('-');
  });
});
