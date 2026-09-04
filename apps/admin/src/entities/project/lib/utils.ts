import { ProjectStatus } from '@repo/shared/types';

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
