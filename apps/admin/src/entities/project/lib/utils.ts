import { ProjectRequestStatus, ProjectStatus } from '@repo/shared/types';

export const getProjectStatusLabel = (status: ProjectStatus) => {
  switch (status) {
    case 'ACTIVE':
      return '운영 중';
    case 'ENDED':
      return '종료';
    default:
      return '-';
  }
};

/** 표에 넣기 좋게 리포지토리 URL에서 프로토콜과 호스트를 걷어낸다. URL이 아니면 원본을 그대로 쓴다. */
export const getRepositoryLabel = (repository: string) => {
  try {
    const { hostname, pathname } = new URL(repository);
    const path = pathname.replace(/^\/+|\/+$/g, '');

    return path || hostname;
  } catch {
    return repository;
  }
};

export const getProjectRequestStatusLabel = (status: ProjectRequestStatus) => {
  switch (status) {
    case 'PENDING':
      return '심사 중';
    case 'ACCEPTED':
      return '승인됨';
    case 'REJECTED':
      return '거절됨';
    default:
      return status;
  }
};

export const getProjectRequestStatusVariant = (
  status: ProjectRequestStatus,
): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'ACCEPTED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

/** 심사 화면 상태 탭. 어드민은 상태별로만 보므로 '전체'는 두지 않는다. */
export const PROJECT_REQUEST_STATUS_TABS: { value: ProjectRequestStatus; label: string }[] = [
  { value: 'PENDING', label: '심사 중' },
  { value: 'ACCEPTED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
];
