import type { MyProject } from '@repo/shared/types';

/**
 * 내 프로젝트 카드의 표시 상태.
 * `projectId` 유무로 "이미 등록된 프로젝트"와 "등록 전 신청"을 먼저 가른 뒤 requestStatus를 해석한다.
 */
export type MyProjectDisplayKind =
  /** 승인 완료 — 등록된 프로젝트 */
  | 'REGISTERED'
  /** 승인본 + 수정 심사 중 (내용은 수정안 기준) */
  | 'EDIT_PENDING'
  /** 승인본 + 수정 거절 — 프로젝트 자체는 유효 (내용은 원본 기준) */
  | 'EDIT_REJECTED'
  /** 신규 신청 심사 중 */
  | 'REQUEST_PENDING'
  /** 신규 신청 거절 — 등록 자체가 무산 */
  | 'REQUEST_REJECTED';

export interface MyProjectDisplay {
  kind: MyProjectDisplayKind;
  /** 이미 등록되어 공개 목록에 노출되는 프로젝트인지 */
  isRegistered: boolean;
  badgeLabel: string;
  badgeVariant: 'default' | 'secondary' | 'destructive';
  /** 카드 본문 위에 덧붙일 안내 문구 (없으면 null) */
  notice: string | null;
  /** 거절 사유를 노출해야 하는 상태인지 */
  showRejectReason: boolean;
}

const DISPLAY: Record<MyProjectDisplayKind, Omit<MyProjectDisplay, 'kind'>> = {
  REGISTERED: {
    isRegistered: true,
    badgeLabel: '등록됨',
    badgeVariant: 'default',
    notice: null,
    showRejectReason: false,
  },
  EDIT_PENDING: {
    isRegistered: true,
    badgeLabel: '수정 심사 중',
    badgeVariant: 'secondary',
    notice: '수정 심사 중 · 아래 내용은 수정안 기준입니다.',
    showRejectReason: false,
  },
  EDIT_REJECTED: {
    isRegistered: true,
    badgeLabel: '등록됨',
    badgeVariant: 'default',
    notice: '최근 수정 신청이 거절되었습니다 · 아래 내용은 기존 등록본 기준입니다.',
    showRejectReason: true,
  },
  REQUEST_PENDING: {
    isRegistered: false,
    badgeLabel: '신청 대기 중',
    badgeVariant: 'secondary',
    notice: null,
    showRejectReason: false,
  },
  REQUEST_REJECTED: {
    isRegistered: false,
    badgeLabel: '거절됨',
    badgeVariant: 'destructive',
    notice: null,
    showRejectReason: true,
  },
};

const resolveKind = (project: MyProject): MyProjectDisplayKind => {
  // projectId가 있으면 이미 등록된 프로젝트다. 수정 신청이 거절돼도 프로젝트 자체는 유효하다.
  if (project.projectId !== null) {
    if (project.requestStatus === 'PENDING') return 'EDIT_PENDING';
    if (project.requestStatus === 'REJECTED') return 'EDIT_REJECTED';

    return 'REGISTERED';
  }

  // projectId가 없으면 아직 등록 전이므로 거절은 등록 자체가 무산된 상태다.
  if (project.requestStatus === 'REJECTED') return 'REQUEST_REJECTED';

  return 'REQUEST_PENDING';
};

/** `projectId`와 `requestStatus`를 조합해 내 프로젝트 카드의 표시 상태를 결정한다. */
export const getMyProjectDisplay = (project: MyProject): MyProjectDisplay => {
  const kind = resolveKind(project);

  return { kind, ...DISPLAY[kind] };
};
