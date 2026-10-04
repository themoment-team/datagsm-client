// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getDeploymentUrlLabel, getProjectStatusLabel, getRepositoryLabel } from './utils';

describe('getProjectStatusLabel', () => {
  it('운영 상태를 보여주고, 모르는 값은 -로 보여준다', () => {
    expect(getProjectStatusLabel('ACTIVE')).toBe('운영 중');
    expect(getProjectStatusLabel('ENDED')).toBe('종료');
    expect(getProjectStatusLabel('UNKNOWN' as never)).toBe('-');
  });
});

describe('getRepositoryLabel', () => {
  it.each([
    ['https://github.com/themoment-team/datagsm-client', 'themoment-team/datagsm-client'],
    ['https://github.com/themoment-team/datagsm-client/', 'themoment-team/datagsm-client'],
    ['https://gitlab.com/group/sub/repo.git', 'group/sub/repo.git'],
  ])('%s는 호스트를 빼고 %s로 보여준다', (url, label) => {
    expect(getRepositoryLabel(url)).toBe(label);
  });

  it('경로가 없으면 호스트를 보여준다', () => {
    expect(getRepositoryLabel('https://example.com/')).toBe('example.com');
  });

  it('URL이 아니면 입력 그대로 보여준다', () => {
    expect(getRepositoryLabel('themoment-team/datagsm-client')).toBe(
      'themoment-team/datagsm-client',
    );
  });
});

describe('getDeploymentUrlLabel', () => {
  it.each([
    ['https://datagsm.kr', 'datagsm.kr'],
    ['https://app.datagsm.kr/dashboard?tab=1', 'app.datagsm.kr'],
    ['http://localhost:3000/', 'localhost:3000'],
  ])('%s는 %s로 보여준다', (url, label) => {
    expect(getDeploymentUrlLabel(url)).toBe(label);
  });

  it('URL이 아니면 입력 그대로 보여준다', () => {
    expect(getDeploymentUrlLabel('datagsm.kr')).toBe('datagsm.kr');
  });
});
