import type { ClubSummary, PublicProject } from '@repo/shared/types';
import {
  apiPath,
  apiSuccess,
  createPublicClubListData,
  http,
  mockRouter,
  renderWithProviders,
  screen,
  selectOption,
  server,
  setMockSearchParams,
  waitFor,
  within,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import ProjectsPage from '.';

const activeClub: ClubSummary = { id: 1, name: '운영동아리', type: 'MAJOR_CLUB' };
const abolishedClub: ClubSummary = { id: 2, name: '폐지동아리', type: 'MAJOR_CLUB' };

describe('ProjectsPage 동아리 필터', () => {
  it('폐지된 동아리도 선택지에 넣되 (폐지)로 구분한다', async () => {
    server.use(
      http.get(apiPath('/v1/public/projects'), () =>
        apiSuccess({ totalPages: 0, totalElements: 0, projects: [] }),
      ),
      http.get(apiPath('/v1/public/clubs'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('clubStatus');
        return apiSuccess(
          createPublicClubListData(
            status === 'ACTIVE' ? [activeClub] : [activeClub, abolishedClub],
          ),
        );
      }),
    );
    const { user } = renderWithProviders(<ProjectsPage />);

    const clubFilter = await screen.findByRole('combobox', { name: '동아리' });
    clubFilter.focus();
    await user.keyboard('{ArrowDown}');

    expect(await screen.findByRole('option', { name: '폐지동아리 (폐지)' })).toBeVisible();
    expect(screen.getByRole('option', { name: '운영동아리' })).toBeVisible();
  });
});

const publicProject: PublicProject = {
  id: 7,
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2024,
  endYear: null,
  status: 'ACTIVE',
  categories: ['TEAM'],
  iconUrl: null,
  deploymentUrl: null,
  club: null,
  participants: [],
  repositories: [],
  techStacks: [],
};

/** 공개 목록 응답을 정하고, 요청에 실린 category를 기록한다 */
const mockPublicProjects = (projects: PublicProject[] = []) => {
  const categories: (string | null)[] = [];
  server.use(
    http.get(apiPath('/v1/public/projects'), ({ request }) => {
      categories.push(new URL(request.url).searchParams.get('category'));
      return apiSuccess({ totalPages: 1, totalElements: projects.length, projects });
    }),
    http.get(apiPath('/v1/public/clubs'), () => apiSuccess(createPublicClubListData([]))),
  );
  return categories;
};

describe('ProjectsPage 카테고리 필터', () => {
  it('URL의 category로 목록을 조회하고 필터에 선택된 이름을 보여준다', async () => {
    setMockSearchParams({ category: 'IDEA_FESTIVAL' });
    const categories = mockPublicProjects();

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => expect(categories).toEqual(['IDEA_FESTIVAL']));
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveTextContent(
      '카테고리: 아이디어페스티벌',
    );
  });

  it('카테고리를 고르면 첫 페이지로 돌아가 URL에 반영한다', async () => {
    setMockSearchParams({ page: '2' });
    mockPublicProjects();
    const { user } = renderWithProviders(<ProjectsPage />);

    await selectOption(user, screen.getByRole('combobox', { name: '카테고리' }), '팀 프로젝트');

    expect(mockRouter.push).toHaveBeenCalledWith('/?category=TEAM', { scroll: false });
  });

  it('목록에 없는 category는 전체로 조회한다', async () => {
    setMockSearchParams({ category: 'foo' });
    const categories = mockPublicProjects([publicProject]);

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    expect(categories).toEqual([null]);
  });
});

describe('ProjectsPage 카테고리 표시', () => {
  it('카드에 카테고리를 모두 보여주고, 카테고리가 없으면 미분류 배지를 붙이지 않는다', async () => {
    mockPublicProjects([
      { ...publicProject, categories: ['TEAM', 'NOT_DEPLOYED'] },
      { ...publicProject, id: 8, name: '구 포털', categories: [] },
    ]);

    renderWithProviders(<ProjectsPage />);

    const card = await screen.findByRole('link', { name: /DataGSM/ });
    expect(within(card).getByText('팀 프로젝트')).toBeInTheDocument();
    expect(within(card).getByText('미배포')).toBeInTheDocument();

    const uncategorizedCard = screen.getByRole('link', { name: /구 포털/ });
    expect(within(uncategorizedCard).queryByText('미분류')).not.toBeInTheDocument();
    expect(within(uncategorizedCard).queryByText('팀 프로젝트')).not.toBeInTheDocument();
  });
});
