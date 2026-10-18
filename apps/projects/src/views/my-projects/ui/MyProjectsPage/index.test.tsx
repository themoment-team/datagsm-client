import type { MyProject } from '@repo/shared/types';
import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  createMyAccount,
  createParticipantCandidateListData,
  createPublicClubListData,
  http,
  renderWithProviders,
  screen,
  server,
  setMockSearchParams,
  waitFor,
  within,
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
  categories: [],
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

/** 수정·재신청 폼이 여는 조회를 비워 두고, 제출된 신청의 메서드와 경로를 기록한다 */
const mockProjectForm = () => {
  const submits: string[] = [];
  const record = (method: string, request: Request) => {
    submits.push(`${method} ${new URL(request.url).pathname.replace('/api', '')}`);
    return apiSuccess(null);
  };
  server.use(
    http.get(apiPath('/v1/public/clubs'), () => apiSuccess(createPublicClubListData([]))),
    http.get(apiPath('/v1/accounts/my'), () => apiSuccess(createMyAccount())),
    http.get(apiPath('/v1/students/participant-candidates'), () =>
      apiSuccess(createParticipantCandidateListData([])),
    ),
    http.post(apiPath('/v1/students/me/projects'), ({ request }) => record('POST', request)),
    http.put(apiPath('/v1/students/me/projects/:id'), ({ request }) => record('PUT', request)),
  );
  return submits;
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

  it('카드에 카테고리를 모두 보여 주고, 없으면 미분류로 보여 준다', async () => {
    mockMyProjects(() =>
      apiSuccess({
        totalElements: 2,
        projects: [
          { ...myProject, categories: ['CLUB', 'IDEA_FESTIVAL'] },
          { ...myProject, projectId: 11, name: '구 포털' },
        ],
      }),
    );

    renderWithProviders(<MyProjectsPage />);

    expect(await screen.findByText('동아리 프로젝트')).toBeInTheDocument();
    expect(screen.getByText('아이디어페스티벌')).toBeInTheDocument();
    // 카테고리가 있는 카드에는 미분류가 붙지 않아 한 번만 나온다.
    expect(screen.getByText('미분류')).toBeInTheDocument();
  });

  it('신규 신청의 requestId와 등록된 프로젝트의 projectId가 같아도 두 카드를 key 충돌 없이 보여 준다', async () => {
    const consoleError = vi.spyOn(console, 'error');
    const newRequest: MyProject = {
      ...myProject,
      projectId: null,
      requestId: 3,
      requestStatus: 'PENDING',
      name: '새 프로젝트',
    };
    const registered: MyProject = { ...myProject, projectId: 3, requestId: null };
    mockMyProjects(() => apiSuccess({ totalElements: 2, projects: [newRequest, registered] }));

    renderWithProviders(<MyProjectsPage />);

    expect(await screen.findByRole('heading', { name: '새 프로젝트' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    // React는 형제 key가 겹치면 console.error로 duplicate key 경고를 남긴다.
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('same key');
  });
});

describe('MyProjectsPage 수정·재신청', () => {
  it('심사 중인 신규 신청은 수정 버튼 없이 심사가 끝나기 전에는 수정할 수 없다고 안내한다', async () => {
    const pendingRequest: MyProject = {
      ...myProject,
      projectId: null,
      requestId: 3,
      requestStatus: 'PENDING',
      status: null,
    };
    mockMyProjects(() => apiSuccess({ totalElements: 1, projects: [pendingRequest] }));

    renderWithProviders(<MyProjectsPage />);

    expect(
      await screen.findByText('신청 심사 중 · 심사가 끝나기 전에는 수정할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
  });

  it('거절된 신규 신청은 재신청 버튼으로 연 폼에서 새로 신청한다', async () => {
    const rejectedRequest: MyProject = {
      ...myProject,
      projectId: null,
      requestId: 3,
      requestStatus: 'REJECTED',
      rejectReason: '설명이 부족합니다',
      status: null,
      categories: ['TEAM'],
    };
    mockMyProjects(() => apiSuccess({ totalElements: 1, projects: [rejectedRequest] }));
    const submits = mockProjectForm();
    const { user } = renderWithProviders(<MyProjectsPage />);

    await user.click(await screen.findByRole('button', { name: '재신청' }));
    const dialog = await screen.findByRole('dialog', { name: '프로젝트 재신청' });
    // 내 정보를 불러오기 전에는 제출 버튼이 잠겨 있다.
    const submitButton = within(dialog).getByRole('button', { name: '재신청' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await screen.findByText('재신청이 접수되었습니다.');
    expect(submits).toEqual(['POST /v1/students/me/projects']);
  });

  it('등록된 프로젝트는 수정 버튼으로 연 폼에서 그 프로젝트에 수정 신청한다', async () => {
    mockMyProjects(() =>
      apiSuccess({ totalElements: 1, projects: [{ ...myProject, categories: ['TEAM'] }] }),
    );
    const submits = mockProjectForm();
    const { user } = renderWithProviders(<MyProjectsPage />);

    await user.click(await screen.findByRole('button', { name: '수정' }));
    const dialog = await screen.findByRole('dialog', { name: '프로젝트 수정 신청' });
    const submitButton = within(dialog).getByRole('button', { name: '수정 신청' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await screen.findByText('수정 신청이 접수되었습니다.');
    expect(submits).toEqual(['PUT /v1/students/me/projects/10']);
  });
});
