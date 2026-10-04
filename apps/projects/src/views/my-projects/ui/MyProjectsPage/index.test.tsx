import type { MyProject } from '@repo/shared/types';
import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
  setMockSearchParams,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import MyProjectsPage from '.';

// 로그인 전용 화면이라 로그인한 상태로 렌더링한다.
vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  getIsAuthenticated: () => true,
  startLogin: vi.fn(),
}));

const EMPTY_MESSAGE = '신청하거나 참여 중인 프로젝트가 없습니다.';
const GENERIC_ERROR_MESSAGE = '프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

const myProject: MyProject = {
  projectId: 10,
  requestId: null,
  requestStatus: 'ACCEPTED',
  rejectReason: null,
  role: 'OWNER',
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2024,
  endYear: null,
  status: 'ACTIVE',
  iconUrl: null,
  iconKey: null,
  deploymentUrl: null,
  club: null,
  participants: [],
  repositories: [],
  techStacks: [],
};

/** 내 프로젝트 조회 응답을 정하고, 요청에 실린 requestStatus를 기록한다 */
const mockMyProjects = (respond: () => Response) => {
  const requestStatuses: (string | null)[] = [];
  server.use(
    http.get(apiPath('/v1/students/me/projects'), ({ request }) => {
      requestStatuses.push(new URL(request.url).searchParams.get('requestStatus'));
      return respond();
    }),
  );
  return requestStatuses;
};

describe('MyProjectsPage', () => {
  it('필터 목록에 없는 status는 전체로 조회하고 전체 필터를 강조한다', async () => {
    setMockSearchParams({ status: 'foo' });
    const requestStatuses = mockMyProjects(() =>
      apiSuccess({ totalElements: 1, projects: [myProject] }),
    );

    renderWithProviders(<MyProjectsPage />);

    expect(await screen.findByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    expect(requestStatuses).toEqual([null]);
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('학생 정보가 연결되지 않아 403이 나면 서버 메시지를 보여 주고 빈 목록 문구는 띄우지 않는다', async () => {
    mockMyProjects(() => apiError(403, '학생 정보가 연결되지 않은 계정입니다.'));

    renderWithProviders(<MyProjectsPage />);

    expect(await screen.findByText('학생 정보가 연결되지 않은 계정입니다.')).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('메시지 없이 500이 나면 일반 오류 문구를 보여 준다', async () => {
    mockMyProjects(() => new HttpResponse(null, { status: 500 }));

    renderWithProviders(<MyProjectsPage />);

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('조회에 성공했는데 프로젝트가 없으면 빈 목록 문구를 보여 준다', async () => {
    mockMyProjects(() => apiSuccess({ totalElements: 0, projects: [] }));

    renderWithProviders(<MyProjectsPage />);

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).not.toBeInTheDocument();
  });
});
