import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  createClubListData,
  createProject,
  createProjectListData,
  createStudentListData,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import ProjectsPage from '.';

const EMPTY_MESSAGE = '프로젝트 데이터가 없습니다.';
const GENERIC_ERROR_MESSAGE = '프로젝트 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

/** 프로젝트 목록 조회 응답을 정한다. 필터와 폼에 쓰는 동아리·학생 목록은 비워서 돌려준다. */
const mockProjects = (respond: () => Response) => {
  server.use(
    http.get(apiPath('/v1/projects'), () => respond()),
    http.get(apiPath('/v1/clubs'), () => apiSuccess(createClubListData([]))),
    http.get(apiPath('/v1/students'), () => apiSuccess(createStudentListData([]))),
  );
};

const pagination = () => screen.queryByRole('navigation', { name: 'pagination' });

describe('ProjectsPage', () => {
  it('서버 메시지와 함께 500이 나면 그 메시지를 보여 주고 빈 목록 문구는 띄우지 않는다', async () => {
    mockProjects(() => apiError(500, '서버 오류가 발생했습니다.'));

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText('서버 오류가 발생했습니다.')).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('메시지 없이 500이 나면 일반 오류 문구를 보여 준다', async () => {
    mockProjects(() => new HttpResponse(null, { status: 500 }));

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('조회에 성공했는데 프로젝트가 없으면 빈 목록 문구를 보여 준다', async () => {
    mockProjects(() => apiSuccess(createProjectListData([], { totalPages: 0 })));

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).not.toBeInTheDocument();
  });

  it('삭제한 뒤 목록을 다시 불러오지 못하면 삭제 전 목록과 페이지 버튼 대신 오류 문구를 보여 준다', async () => {
    let listRequestCount = 0;
    mockProjects(() =>
      ++listRequestCount === 1
        ? apiSuccess(createProjectListData([createProject({ name: 'DataGSM' })], { totalPages: 2 }))
        : new HttpResponse(null, { status: 500 }),
    );
    server.use(http.delete(apiPath('/v1/projects/:id'), () => apiSuccess(null)));
    const { user } = renderWithProviders(<ProjectsPage />);

    expect(await screen.findByRole('cell', { name: 'DataGSM' })).toBeInTheDocument();
    expect(pagination()).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: '확인' }),
    );

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(pagination()).not.toBeInTheDocument();
  });
});
