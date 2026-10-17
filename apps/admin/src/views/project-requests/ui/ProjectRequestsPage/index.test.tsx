import type { ProjectEditRequest } from '@repo/shared/types';
import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  createClubMember,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import ProjectRequestsPage from '.';

const EMPTY_MESSAGE = '해당 상태의 신청이 없습니다.';
const GENERIC_ERROR_MESSAGE = '신청 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

const pendingRequest: ProjectEditRequest = {
  id: 3,
  originalProjectId: null,
  requestedBy: createClubMember({ id: 1, name: '김신청' }),
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2024,
  categories: [],
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

/** 심사 목록 조회 응답을 정하고, 요청에 실린 requestStatus를 기록한다 */
const mockProjectRequests = (respond: () => Response) => {
  const requestStatuses: (string | null)[] = [];
  server.use(
    http.get(apiPath('/v1/projects/requests'), ({ request }) => {
      requestStatuses.push(new URL(request.url).searchParams.get('requestStatus'));
      return respond();
    }),
  );
  return requestStatuses;
};

const requestCard = () => screen.queryByRole('button', { name: /DataGSM/ });
const pagination = () => screen.queryByRole('navigation', { name: 'pagination' });

describe('ProjectRequestsPage', () => {
  it('서버 메시지와 함께 500이 나면 그 메시지를 보여 주고 빈 목록 문구는 띄우지 않는다', async () => {
    mockProjectRequests(() => apiError(500, '서버 오류가 발생했습니다.'));

    renderWithProviders(<ProjectRequestsPage />);

    expect(await screen.findByText('서버 오류가 발생했습니다.')).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('메시지 없이 500이 나면 일반 오류 문구를 보여 준다', async () => {
    mockProjectRequests(() => new HttpResponse(null, { status: 500 }));

    renderWithProviders(<ProjectRequestsPage />);

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('조회에 성공했는데 신청이 없으면 빈 목록 문구를 보여 준다', async () => {
    mockProjectRequests(() => apiSuccess({ totalPages: 0, totalElements: 0, requests: [] }));

    renderWithProviders(<ProjectRequestsPage />);

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).not.toBeInTheDocument();
  });

  it('수락한 뒤 목록을 다시 불러오지 못하면 처리 전 목록과 페이지 버튼 대신 오류 문구를 보여 준다', async () => {
    let listRequestCount = 0;
    mockProjectRequests(() =>
      ++listRequestCount === 1
        ? apiSuccess({ totalPages: 2, totalElements: 21, requests: [pendingRequest] })
        : new HttpResponse(null, { status: 500 }),
    );
    server.use(http.post(apiPath('/v1/projects/requests/:id/accept'), () => apiSuccess(null)));
    const { user } = renderWithProviders(<ProjectRequestsPage />);

    const card = await screen.findByRole('button', { name: /DataGSM/ });
    expect(pagination()).toBeInTheDocument();

    await user.click(card);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '수락' }));

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(requestCard()).not.toBeInTheDocument();
    expect(pagination()).not.toBeInTheDocument();
  });
});
