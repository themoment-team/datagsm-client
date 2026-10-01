// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  getDeploymentUrlLabel,
  getProjectStatusLabel,
  getRepositoryLabel,
  getSafeDeploymentUrl,
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

describe('getSafeDeploymentUrl', () => {
  it('http(s) 주소만 그대로 돌려준다', () => {
    expect(getSafeDeploymentUrl('https://datagsm.kr')).toBe('https://datagsm.kr');
    expect(getSafeDeploymentUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it.each([null, undefined, '', 'javascript:alert(1)', 'ftp://datagsm.kr'])(
    '%s는 링크로 쓰지 않는다',
    (url) => {
      expect(getSafeDeploymentUrl(url)).toBeNull();
    },
  );
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
