import type { MyProject } from '@repo/shared/types';
import {
  apiPath,
  apiSuccess,
  createClubListData,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import ProjectFormDialog from '.';

const ICON_KEY = 'project-icons/3f2504e0-4f89-11d3-9a0c-0305e82c3301.png';

/** 대기 중인 수정안처럼 원본과 다른 아이콘·배포 URL을 가진 카드 */
const editingProject: MyProject = {
  projectId: 10,
  requestId: 20,
  requestStatus: 'PENDING',
  rejectReason: null,
  role: 'OWNER',
  name: 'DataGSM',
  description: '학교 데이터 API',
  startYear: 2024,
  endYear: null,
  status: 'ACTIVE',
  iconUrl: `https://cdn.datagsm.kr/${ICON_KEY}`,
  iconKey: ICON_KEY,
  deploymentUrl: 'https://datagsm.kr',
  club: null,
  participants: [],
  repositories: [],
  techStacks: [],
};

const mockProjectApi = () => {
  const requests: { method: string; path: string; body: unknown }[] = [];
  const record = async (method: string, request: Request) => {
    requests.push({
      method,
      path: new URL(request.url).pathname.replace('/api', ''),
      body: await request.json(),
    });
    return apiSuccess(null);
  };
  server.use(
    http.get(apiPath('/v1/clubs'), () => apiSuccess(createClubListData([]))),
    http.post(apiPath('/v1/students/me/projects'), ({ request }) => record('POST', request)),
    http.put(apiPath('/v1/students/me/projects/:id'), ({ request }) => record('PUT', request)),
  );
  return requests;
};

const openEditDialog = (initial: MyProject) =>
  renderWithProviders(
    <ProjectFormDialog
      mode="edit"
      initial={initial}
      projectId={initial.projectId}
      open
      onOpenChange={() => {}}
    />,
  );

const dialog = () => screen.getByRole('dialog');

describe('ProjectFormDialog 수정 신청', () => {
  it('건드리지 않은 아이콘 키와 배포 URL을 그대로 보낸다', async () => {
    const requests = mockProjectApi();
    const { user } = openEditDialog(editingProject);

    await user.click(within(dialog()).getByRole('button', { name: '수정 신청' }));

    await screen.findByText('수정 신청이 접수되었습니다.');
    expect(requests).toEqual([
      {
        method: 'PUT',
        path: '/v1/students/me/projects/10',
        body: expect.objectContaining({ iconKey: ICON_KEY, deploymentUrl: 'https://datagsm.kr' }),
      },
    ]);
  });

  it('아이콘을 제거하고 배포 URL을 비우면 빈 문자열로 보내 삭제한다', async () => {
    const requests = mockProjectApi();
    const { user } = openEditDialog(editingProject);

    await user.click(within(dialog()).getByRole('button', { name: '아이콘 제거' }));
    await user.clear(within(dialog()).getByLabelText('배포 URL'));
    await user.click(within(dialog()).getByRole('button', { name: '수정 신청' }));

    await screen.findByText('수정 신청이 접수되었습니다.');
    expect(requests[0]?.body).toMatchObject({ iconKey: '', deploymentUrl: '' });
  });

  it('등록 전 신청을 다시 내면 기존 아이콘 키를 함께 보낸다', async () => {
    const requests = mockProjectApi();
    const { user } = openEditDialog({ ...editingProject, projectId: null, status: null });

    await user.click(within(dialog()).getByRole('button', { name: '수정 신청' }));

    await screen.findByText('프로젝트 신청이 접수되었습니다.');
    expect(requests).toEqual([
      {
        method: 'POST',
        path: '/v1/students/me/projects',
        body: expect.objectContaining({ iconKey: ICON_KEY }),
      },
    ]);
  });
});
