// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  getDeploymentUrlLabel,
  getProjectStatusLabel,
  getRepositoryLabel,
  parseProjectRequestStatus,
} from './utils';

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

describe('parseProjectRequestStatus', () => {
  it.each(['PENDING', 'ACCEPTED', 'REJECTED'] as const)('탭에 있는 %s는 그대로 쓴다', (value) => {
    expect(parseProjectRequestStatus(value)).toBe(value);
  });

  it.each([null, undefined, ''])('%s는 상태로 보지 않는다', (value) => {
    expect(parseProjectRequestStatus(value)).toBeUndefined();
  });

  it.each(['foo', 'pending', 'all', 'ACTIVE'])('탭에 없는 %s는 상태로 보지 않는다', (value) => {
    expect(parseProjectRequestStatus(value)).toBeUndefined();
  });
});
