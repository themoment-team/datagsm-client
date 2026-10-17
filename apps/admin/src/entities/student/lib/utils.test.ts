// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getMajorLabel, getRoleLabel, getSexLabel } from './utils';

describe('학생 라벨', () => {
  it.each([
    ['GENERAL_STUDENT', '일반학생'],
    ['STUDENT_COUNCIL', '학생회'],
    ['DORMITORY_MANAGER', '기자위'],
    ['GRADUATE', '졸업생'],
    ['WITHDRAWN', '자퇴생'],
  ] as const)('구분 %s는 %s로 보여준다', (role, label) => {
    expect(getRoleLabel(role)).toBe(label);
  });

  it.each([
    ['SW_DEVELOPMENT', 'SW개발과'],
    ['SMART_IOT', '스마트IoT과'],
    ['AI', 'AI과'],
  ] as const)('학과 %s는 %s로 보여준다', (major, label) => {
    expect(getMajorLabel(major)).toBe(label);
  });

  it('모르는 학과와 성별 값은 받은 그대로 보여준다', () => {
    expect(getMajorLabel('DESIGN' as never)).toBe('DESIGN');
    expect(getSexLabel('UNKNOWN' as never)).toBe('UNKNOWN');
  });

  it('성별을 한 글자로 보여준다', () => {
    expect(getSexLabel('MAN')).toBe('남');
    expect(getSexLabel('WOMAN')).toBe('여');
  });
});
