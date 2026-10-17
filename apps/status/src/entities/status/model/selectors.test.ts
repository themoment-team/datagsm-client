// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getOverallStatus, hasDeployingServer, hasDownServer, isAllOperational } from './selectors';
import type { Server, ServerStatus } from './types';

const servers = (...statuses: ServerStatus[]): Server[] =>
  statuses.map((status, index) => ({ name: `server-${index}`, description: '', status }));

describe('서버 상태 판정', () => {
  it('모든 서버가 200이어야 정상으로 본다', () => {
    expect(isAllOperational(servers(200, 200))).toBe(true);
    expect(isAllOperational(servers(200, 503))).toBe(false);
  });

  it('502는 다운, 503은 배포 중으로 본다', () => {
    expect(hasDownServer(servers(200, 502))).toBe(true);
    expect(hasDownServer(servers(200, 503))).toBe(false);
    expect(hasDeployingServer(servers(200, 503))).toBe(true);
  });
});

describe('getOverallStatus', () => {
  it('모두 정상이면 success', () => {
    expect(getOverallStatus(servers(200, 200, 200))).toEqual({
      label: '모든 서비스 정상',
      tone: 'success',
    });
  });

  it('배포 중인 서버가 있으면 warning', () => {
    expect(getOverallStatus(servers(200, 503))).toEqual({ label: '배포 진행 중', tone: 'warning' });
  });

  it('다운된 서버가 있으면 배포 중인 서버가 함께 있어도 error를 우선한다', () => {
    expect(getOverallStatus(servers(503, 502, 200))).toEqual({
      label: '일부 서비스 장애',
      tone: 'error',
    });
  });

  // 확인할 서버가 없을 때도 정상으로 표시한다. 현재 동작을 기록한다.
  it('서버 목록이 비어 있으면 정상으로 본다', () => {
    expect(getOverallStatus([]).tone).toBe('success');
  });
});
