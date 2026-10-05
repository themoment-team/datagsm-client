import type { MyProject } from '@repo/shared/types';
import {
  HttpResponse,
  apiPath,
  apiSuccess,
  createClubListData,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { File as NodeFile } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import ProjectFormDialog from '.';

const ICON_KEY = 'project-icons/3f2504e0-4f89-11d3-9a0c-0305e82c3301.png';
const NEW_ICON_KEY = 'project-icons/9b2c6a1e-7d3f-4e8a-b5c0-1f2e3d4c5b6a.png';
const ICON_UPLOAD_URL = 'https://s3.example.com/project-icons/upload';

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
  participants: [
    {
      id: 101,
      name: '홍길동',
      email: 's24001@gsm.hs.kr',
      studentNumber: 1101,
      major: 'SW_DEVELOPMENT',
      sex: 'MAN',
    },
    {
      id: 102,
      name: '김영희',
      email: 's24002@gsm.hs.kr',
      studentNumber: 1102,
      major: 'AI',
      sex: 'WOMAN',
    },
  ],
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

/** S3 업로드(PUT)는 돌려받은 함수를 부를 때까지 끝나지 않는다. */
const mockIconUpload = ({ uploadStatus = 200 } = {}) => {
  let finishUpload!: () => void;
  const uploadFinished = new Promise<void>((resolve) => {
    finishUpload = resolve;
  });
  server.use(
    http.post(apiPath('/v1/students/me/projects/icons/upload-url'), () =>
      apiSuccess({ uploadUrl: ICON_UPLOAD_URL, iconKey: NEW_ICON_KEY, expiresInSeconds: 300 }),
    ),
    http.put(ICON_UPLOAD_URL, async () => {
      await uploadFinished;
      return new HttpResponse(null, { status: uploadStatus });
    }),
  );
  return finishUpload;
};

const renderEditDialog = (initial: MyProject, open = true) => (
  <ProjectFormDialog
    mode="edit"
    initial={initial}
    projectId={initial.projectId}
    open={open}
    onOpenChange={() => {}}
  />
);

const openEditDialog = (initial: MyProject) => renderWithProviders(renderEditDialog(initial));

const dialog = () => screen.getByRole('dialog');

const iconInput = () => dialog().querySelector<HTMLInputElement>('input[type="file"]')!;

// vitest의 jsdom 호환 계층이 jsdom File을 Node Blob으로 바꾸지 못해 미리보기 URL 생성과
// S3 PUT이 실패하므로 Node의 File을 쓴다.
const iconFile = () => new NodeFile(['icon'], 'icon.png', { type: 'image/png' }) as unknown as File;

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

  it('등록된 프로젝트를 수정하면 기존 참여자 ID를 그대로 보낸다', async () => {
    const requests = mockProjectApi();
    const { user } = openEditDialog(editingProject);

    await user.clear(within(dialog()).getByLabelText('설명'));
    await user.type(within(dialog()).getByLabelText('설명'), '설명만 바꾼 수정안');
    await user.click(within(dialog()).getByRole('button', { name: '수정 신청' }));

    await screen.findByText('수정 신청이 접수되었습니다.');
    expect(requests).toEqual([
      {
        method: 'PUT',
        path: '/v1/students/me/projects/10',
        body: expect.objectContaining({
          description: '설명만 바꾼 수정안',
          participantIds: [101, 102],
        }),
      },
    ]);
  });

  it('등록 전 신청을 다시 내도 기존 참여자 ID를 유지한다', async () => {
    const requests = mockProjectApi();
    const { user } = openEditDialog({ ...editingProject, projectId: null, status: null });

    await user.click(within(dialog()).getByRole('button', { name: '수정 신청' }));

    await screen.findByText('프로젝트 신청이 접수되었습니다.');
    expect(requests).toEqual([
      {
        method: 'POST',
        path: '/v1/students/me/projects',
        body: expect.objectContaining({ participantIds: [101, 102] }),
      },
    ]);
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

describe('ProjectFormDialog 아이콘 업로드 중 제출', () => {
  it('업로드가 끝나기 전에는 제출을 막고, 끝나면 새 아이콘 키로 보낸다', async () => {
    const requests = mockProjectApi();
    const finishUpload = mockIconUpload();
    const { user } = openEditDialog(editingProject);

    await user.upload(iconInput(), iconFile());

    const uploadingButton = await within(dialog()).findByRole('button', {
      name: '아이콘 업로드 중...',
    });
    expect(uploadingButton).toBeDisabled();

    // 버튼이 아닌 Enter 키로도 이전 아이콘 키가 제출되면 안 된다.
    await user.type(within(dialog()).getByLabelText('프로젝트 이름'), '{Enter}');

    finishUpload();
    const submitButton = await within(dialog()).findByRole('button', { name: '수정 신청' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await screen.findByText('수정 신청이 접수되었습니다.');
    expect(requests).toEqual([
      {
        method: 'PUT',
        path: '/v1/students/me/projects/10',
        body: expect.objectContaining({ iconKey: NEW_ICON_KEY }),
      },
    ]);
  });

  it('업로드가 실패하면 다시 제출할 수 있다', async () => {
    const requests = mockProjectApi();
    const finishUpload = mockIconUpload({ uploadStatus: 500 });
    const { user } = openEditDialog(editingProject);

    await user.upload(iconInput(), iconFile());
    await within(dialog()).findByRole('button', { name: '아이콘 업로드 중...' });

    finishUpload();
    await screen.findByText('아이콘 업로드에 실패했습니다.');
    // 실패 토스트가 버튼 상태 갱신보다 먼저 뜰 수 있어, 버튼 문구가 돌아올 때까지 기다린다.
    await user.click(await within(dialog()).findByRole('button', { name: '수정 신청' }));

    await screen.findByText('수정 신청이 접수되었습니다.');
    expect(requests[0]?.body).toMatchObject({ iconKey: ICON_KEY });
  });

  it('업로드 중에 다이얼로그를 닫았다 다시 열면 제출할 수 있다', async () => {
    mockProjectApi();
    const finishUpload = mockIconUpload();
    const { user, rerender } = openEditDialog(editingProject);

    await user.upload(iconInput(), iconFile());
    await within(dialog()).findByRole('button', { name: '아이콘 업로드 중...' });

    rerender(renderEditDialog(editingProject, false));
    rerender(renderEditDialog(editingProject));

    expect(await within(dialog()).findByRole('button', { name: '수정 신청' })).toBeEnabled();
    finishUpload();
  });
});
