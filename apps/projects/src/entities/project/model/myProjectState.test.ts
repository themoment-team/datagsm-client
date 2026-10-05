import type { MyProject } from '@repo/shared/types';
import { describe, expect, it } from 'vitest';

import { getMyProjectDisplay, getMyProjectKey } from './myProjectState';

const buildProject = (override: Partial<MyProject>): MyProject => ({
  projectId: null,
  requestId: null,
  requestStatus: 'PENDING',
  rejectReason: null,
  role: 'OWNER',
  name: '테스트 프로젝트',
  description: '설명',
  startYear: 2024,
  endYear: null,
  status: null,
  iconUrl: null,
  iconKey: null,
  deploymentUrl: null,
  club: null,
  participants: [],
  repositories: [],
  techStacks: [],
  ...override,
});

describe('getMyProjectDisplay', () => {
  it('승인 완료는 등록된 프로젝트로 표시한다', () => {
    const display = getMyProjectDisplay(
      buildProject({ projectId: 10, requestId: null, requestStatus: 'ACCEPTED' }),
    );

    expect(display.kind).toBe('REGISTERED');
    expect(display.isRegistered).toBe(true);
    expect(display.showRejectReason).toBe(false);
  });

  it('승인본의 수정 심사 중은 수정안 기준임을 안내한다', () => {
    const display = getMyProjectDisplay(
      buildProject({ projectId: 10, requestId: 20, requestStatus: 'PENDING' }),
    );

    expect(display.kind).toBe('EDIT_PENDING');
    expect(display.isRegistered).toBe(true);
    expect(display.notice).toContain('수정안');
  });

  it('승인본의 수정이 거절돼도 프로젝트는 유효한 등록 상태로 본다', () => {
    const display = getMyProjectDisplay(
      buildProject({
        projectId: 10,
        requestId: 20,
        requestStatus: 'REJECTED',
        rejectReason: '리포지토리 링크가 유효하지 않습니다',
      }),
    );

    expect(display.kind).toBe('EDIT_REJECTED');
    expect(display.isRegistered).toBe(true);
    expect(display.badgeVariant).toBe('default');
    expect(display.showRejectReason).toBe(true);
  });

  it('신규 신청 심사 중은 등록 전 상태로 본다', () => {
    const display = getMyProjectDisplay(
      buildProject({ projectId: null, requestId: 20, requestStatus: 'PENDING' }),
    );

    expect(display.kind).toBe('REQUEST_PENDING');
    expect(display.isRegistered).toBe(false);
    expect(display.showRejectReason).toBe(false);
  });

  it('신규 신청 거절은 등록이 무산된 상태로 표시한다', () => {
    const display = getMyProjectDisplay(
      buildProject({
        projectId: null,
        requestId: 20,
        requestStatus: 'REJECTED',
        rejectReason: '설명이 부족합니다',
      }),
    );

    expect(display.kind).toBe('REQUEST_REJECTED');
    expect(display.isRegistered).toBe(false);
    expect(display.badgeVariant).toBe('destructive');
    expect(display.showRejectReason).toBe(true);
  });
});

describe('getMyProjectKey', () => {
  it('신규 신청의 requestId와 등록된 프로젝트의 projectId가 같아도 key가 겹치지 않는다', () => {
    const newRequest = buildProject({ projectId: null, requestId: 3, requestStatus: 'PENDING' });
    const registered = buildProject({ projectId: 3, requestId: null, requestStatus: 'ACCEPTED' });

    expect(getMyProjectKey(newRequest)).not.toBe(getMyProjectKey(registered));
  });

  it('등록된 프로젝트는 수정 신청이 생겨도 같은 key를 유지한다', () => {
    const registered = buildProject({ projectId: 10, requestId: null, requestStatus: 'ACCEPTED' });
    const editPending = buildProject({ projectId: 10, requestId: 20, requestStatus: 'PENDING' });

    expect(getMyProjectKey(editPending)).toBe(getMyProjectKey(registered));
  });
});
