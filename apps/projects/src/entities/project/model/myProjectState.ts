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

/** 카드에서 내용을 고쳐 다시 내는 방법 */
export type MyProjectAction =
  /** 등록된 프로젝트의 수정 신청 (PUT) — 서버가 프로젝트당 1건을 최신 내용으로 덮어쓴다 */
  | 'edit'
  /** 거절된 신규 신청을 고쳐 새로 신청 (POST) — 신규 신청은 낼 때마다 새로 생긴다 */
  | 'reapply';

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
  /**
   * 카드에서 할 수 있는 동작 (없으면 null).
   * 신규 신청은 고치거나 취소하는 API가 없어, 심사 중에 다시 내면 신청이 하나 더 생기므로 막는다.
   */
  action: MyProjectAction | null;
}

const DISPLAY: Record<MyProjectDisplayKind, Omit<MyProjectDisplay, 'kind'>> = {
  REGISTERED: {
    isRegistered: true,
    badgeLabel: '등록됨',
    badgeVariant: 'default',
    notice: null,
    showRejectReason: false,
    action: 'edit',
  },
  EDIT_PENDING: {
    isRegistered: true,
    badgeLabel: '수정 심사 중',
    badgeVariant: 'secondary',
    notice: '수정 심사 중 · 아래 내용은 수정안 기준입니다.',
    showRejectReason: false,
    action: 'edit',
  },
  EDIT_REJECTED: {
    isRegistered: true,
    badgeLabel: '등록됨',
    badgeVariant: 'default',
    notice: '최근 수정 신청이 거절되었습니다 · 아래 내용은 기존 등록본 기준입니다.',
    showRejectReason: true,
    action: 'edit',
  },
  REQUEST_PENDING: {
    isRegistered: false,
    badgeLabel: '신청 대기 중',
    badgeVariant: 'secondary',
    notice: '신청 심사 중 · 심사가 끝나기 전에는 수정할 수 없습니다.',
    showRejectReason: false,
    action: null,
  },
  REQUEST_REJECTED: {
    isRegistered: false,
    badgeLabel: '거절됨',
    badgeVariant: 'destructive',
    notice: null,
    showRejectReason: true,
    action: 'reapply',
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

/**
 * 내 프로젝트 목록에서 카드를 구분하는 React key.
 * projectId와 requestId는 서로 다른 테이블의 번호라 값이 겹칠 수 있어 접두사로 구분한다.
 * 등록된 프로젝트는 수정 신청 상태가 바뀌어도 같은 카드로 유지되도록 projectId를 우선한다.
 */
export const getMyProjectKey = (project: MyProject): string =>
  project.projectId !== null ? `project-${project.projectId}` : `request-${project.requestId}`;
