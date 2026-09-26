import { zodResolver } from '@hookform/resolvers/zod';
import type { Project } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  createClub,
  createProject,
  createStudent,
  http,
  renderWithProviders,
  screen,
  selectOption,
  server,
  toClubMember,
  within,
} from '@repo/test-utils';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { AddProjectSchema, AddProjectType } from '@/entities/project';

import ProjectFormDialog from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const students = [
  createStudent({ id: 1, name: '김팀원', grade: 2, classNum: 1, number: 1 }),
  createStudent({ id: 2, name: '이팀원', grade: 2, classNum: 1, number: 2 }),
];
const clubs = [createClub({ id: 5, name: '더모먼트' })];

/** ProjectsPage와 같은 설정으로 폼을 만들어 넘긴다. */
const ProjectFormDialogWithForm = (props: {
  mode: 'create' | 'edit';
  project?: Project;
  open?: boolean;
}) => {
  const form = useForm<AddProjectType>({
    resolver: zodResolver(AddProjectSchema),
    defaultValues: {
      status: 'ACTIVE',
      participantIds: [],
      clubId: 0,
      repositories: [],
      techStacks: [],
    },
  });
  return (
    <ProjectFormDialog
      {...props}
      clubs={clubs}
      students={students}
      form={form}
      onOpenChange={props.open === undefined ? undefined : () => {}}
    />
  );
};

const mockProjectApi = ({ update = () => apiSuccess(null) }: { update?: () => Response } = {}) => {
  const requests: { method: string; path: string; body?: unknown }[] = [];
  const record = async (method: string, request: Request) => {
    const text = await request.text();
    requests.push({
      method,
      path: new URL(request.url).pathname.replace('/api', ''),
      ...(text ? { body: JSON.parse(text) } : {}),
    });
  };
  server.use(
    http.post(apiPath('/v1/projects'), async ({ request }) => {
      await record('POST', request);
      return apiSuccess(null);
    }),
    http.put(apiPath('/v1/projects/:id'), async ({ request }) => {
      await record('PUT', request);
      return update();
    }),
    http.post(apiPath('/v1/projects/:id/end'), async ({ request }) => {
      await record('POST', request);
      return apiSuccess(null);
    }),
    http.post(apiPath('/v1/projects/:id/reactivate'), async ({ request }) => {
      await record('POST', request);
      return apiSuccess(null);
    }),
  );
  return requests;
};

const dialog = () => screen.getByRole('dialog');
const field = (label: string) => within(dialog()).getByLabelText(label);

const addMember = async (user: User, optionText: string) => {
  await user.click(within(dialog()).getByRole('combobox', { name: '' }));
  await user.click(await screen.findByRole('option', { name: optionText }));
};

describe('ProjectFormDialog 추가', () => {
  const openCreateDialog = async () => {
    const view = renderWithProviders(<ProjectFormDialogWithForm mode="create" />);
    await view.user.click(screen.getByRole('button', { name: '+ 프로젝트 추가' }));
    await screen.findByRole('dialog');
    return view;
  };

  it('입력한 프로젝트를 동아리 없이 null로 보내 등록한다', { timeout: 15_000 }, async () => {
    const requests = mockProjectApi();
    const { user } = await openCreateDialog();

    await user.type(field('프로젝트명'), 'DataGSM');
    await user.type(field('시작 연도'), '2025');
    await user.type(field('설명'), '학교 데이터 API');
    await user.type(field('리포지토리'), 'https://github.com/themoment-team/datagsm-client{Enter}');
    await user.type(field('기술 스택'), 'Next.js{Enter}');
    await addMember(user, '2101 김팀원');
    await user.click(within(dialog()).getByRole('button', { name: '+ Add Project' }));

    expect(await screen.findByText('프로젝트가 등록되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual([
      {
        method: 'POST',
        path: '/v1/projects',
        body: {
          name: 'DataGSM',
          description: '학교 데이터 API',
          startYear: 2025,
          clubId: null,
          participantIds: [1],
          status: 'ACTIVE',
          repositories: ['https://github.com/themoment-team/datagsm-client'],
          techStacks: ['Next.js'],
        },
      },
    ]);
  });

  it('배포 URL은 앞뒤 공백을 지워 보낸다', async () => {
    const requests = mockProjectApi();
    const { user } = await openCreateDialog();

    await user.type(field('프로젝트명'), 'DataGSM');
    await user.type(field('시작 연도'), '2025');
    await user.type(field('설명'), '학교 데이터 API');
    await addMember(user, '2101 김팀원');
    await user.type(field('배포 URL'), '  https://datagsm.kr  ');
    await user.click(within(dialog()).getByRole('button', { name: '+ Add Project' }));
    await screen.findByText('프로젝트가 등록되었습니다.');

    expect(requests[0]?.body).toMatchObject({ deploymentUrl: 'https://datagsm.kr' });
  });

  it('배포 URL이 http(s)로 시작하지 않으면 요청하지 않는다', async () => {
    const requests = mockProjectApi();
    const { user } = await openCreateDialog();

    await user.type(field('프로젝트명'), 'DataGSM');
    await user.type(field('시작 연도'), '2025');
    await user.type(field('설명'), '학교 데이터 API');
    await addMember(user, '2101 김팀원');
    await user.type(field('배포 URL'), 'datagsm.kr');
    await user.click(within(dialog()).getByRole('button', { name: '+ Add Project' }));

    expect(
      await screen.findByText('http:// 또는 https://로 시작하는 주소를 입력해주세요.', {
        selector: 'li *',
      }),
    ).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('검증에 걸리면 요청하지 않고 첫 번째 에러를 토스트로 알린다', async () => {
    const requests = mockProjectApi();
    const { user } = await openCreateDialog();

    await user.click(within(dialog()).getByRole('button', { name: '+ Add Project' }));

    expect(
      await screen.findByText('프로젝트명을 입력해주세요.', { selector: 'li *' }),
    ).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('팀원 명단에서 X를 누르면 팀원에서 빠지고 다시 고를 수 있다', async () => {
    mockProjectApi();
    const { user } = await openCreateDialog();
    await addMember(user, '2101 김팀원');

    await user.click(within(dialog()).getByRole('button', { name: /김팀원 제외/ }));

    await user.click(within(dialog()).getByRole('combobox', { name: '' }));
    expect(await screen.findByRole('option', { name: '2101 김팀원' })).toBeInTheDocument();
  });

  it('종료 상태에서만 종료 연도를 받는다', async () => {
    mockProjectApi();
    const { user } = await openCreateDialog();

    expect(within(dialog()).queryByLabelText('종료 연도')).not.toBeInTheDocument();
    await selectOption(user, field('운영 상태'), '종료');

    expect(field('종료 연도')).toBeInTheDocument();
  });
});

describe('ProjectFormDialog 수정', () => {
  const baseProject = createProject({
    id: 11,
    name: 'DataGSM',
    description: '학교 데이터 API',
    startYear: 2024,
    status: 'ACTIVE',
    club: clubs[0]!,
    participants: [toClubMember(students[0]!)],
  });

  const openEditDialog = async (project: Project) => {
    const view = renderWithProviders(
      <ProjectFormDialogWithForm mode="edit" project={project} open />,
    );
    await within(await screen.findByRole('dialog')).findByDisplayValue(project.name);
    return view;
  };

  const submit = (user: User) => user.click(within(dialog()).getByRole('button', { name: '수정' }));

  it('상태가 그대로면 정보만 수정한다', async () => {
    const requests = mockProjectApi();
    const { user } = await openEditDialog(baseProject);

    await user.type(field('설명'), ' v2');
    await submit(user);

    expect(await screen.findByText('프로젝트 데이터가 수정되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual([
      {
        method: 'PUT',
        path: '/v1/projects/11',
        body: expect.objectContaining({ description: '학교 데이터 API v2', clubId: 5 }),
      },
    ]);
  });

  it('운영 중인 프로젝트를 종료로 바꾸면 정보 수정 뒤 종료 처리한다', async () => {
    const requests = mockProjectApi();
    const { user } = await openEditDialog(baseProject);

    await selectOption(user, field('운영 상태'), '종료');
    await user.type(field('종료 연도'), '2026');
    await submit(user);

    await screen.findByText('프로젝트 데이터가 수정되었습니다.');
    expect(requests.map(({ method, path, body }) => [method, path, body])).toEqual([
      ['PUT', '/v1/projects/11', expect.objectContaining({ status: 'ENDED', endYear: 2026 })],
      ['POST', '/v1/projects/11/end', { endYear: 2026 }],
    ]);
  });

  it('종료된 프로젝트의 종료 연도만 바꿔도 종료 처리를 다시 한다', async () => {
    const requests = mockProjectApi();
    const { user } = await openEditDialog({ ...baseProject, status: 'ENDED', endYear: 2025 });

    await user.clear(field('종료 연도'));
    await user.type(field('종료 연도'), '2026');
    await submit(user);

    await screen.findByText('프로젝트 데이터가 수정되었습니다.');
    expect(requests.map(({ path }) => path)).toEqual(['/v1/projects/11', '/v1/projects/11/end']);
  });

  it('종료된 프로젝트를 운영 중으로 바꾸면 정보 수정 뒤 재개 처리한다', async () => {
    const requests = mockProjectApi();
    const { user } = await openEditDialog({ ...baseProject, status: 'ENDED', endYear: 2025 });

    await selectOption(user, field('운영 상태'), '운영 중');
    await submit(user);

    await screen.findByText('프로젝트 데이터가 수정되었습니다.');
    expect(requests.map(({ method, path }) => [method, path])).toEqual([
      ['PUT', '/v1/projects/11'],
      ['POST', '/v1/projects/11/reactivate'],
    ]);
    expect(requests[0]?.body).not.toHaveProperty('endYear');
  });

  it('배포 URL을 건드리지 않아도 기존 값을 유지해 보낸다', async () => {
    const requests = mockProjectApi();
    const { user } = await openEditDialog({ ...baseProject, deploymentUrl: 'https://datagsm.kr' });

    expect(field('배포 URL')).toHaveValue('https://datagsm.kr');
    await user.type(field('설명'), ' v2');
    await submit(user);

    await screen.findByText('프로젝트 데이터가 수정되었습니다.');
    expect(requests[0]?.body).toMatchObject({ deploymentUrl: 'https://datagsm.kr' });
  });

  it('배포 URL을 지우면 빈 문자열로 보내 삭제한다', async () => {
    const requests = mockProjectApi();
    const { user } = await openEditDialog({ ...baseProject, deploymentUrl: 'https://datagsm.kr' });

    await user.clear(field('배포 URL'));
    await submit(user);

    await screen.findByText('프로젝트 데이터가 수정되었습니다.');
    expect(requests[0]?.body).toMatchObject({ deploymentUrl: '' });
  });

  it('응답에 리포지토리·기술 스택이 없는 프로젝트도 수정할 수 있다', async () => {
    const requests = mockProjectApi();
    const legacyProject = { ...baseProject, repositories: undefined, techStacks: undefined };
    const { user } = await openEditDialog(legacyProject as unknown as Project);

    await submit(user);

    await screen.findByText('프로젝트 데이터가 수정되었습니다.');
    expect(requests[0]?.body).toMatchObject({ repositories: [], techStacks: [] });
  });

  it('수정에 실패하면 안내하고 종료·재개 처리를 하지 않는다', async () => {
    const requests = mockProjectApi({ update: () => apiError(500, 'error') });
    const { user } = await openEditDialog(baseProject);

    await selectOption(user, field('운영 상태'), '종료');
    await user.type(field('종료 연도'), '2026');
    await submit(user);

    expect(await screen.findByText('프로젝트 데이터 수정에 실패했습니다.')).toBeInTheDocument();
    expect(requests.map(({ path }) => path)).toEqual(['/v1/projects/11']);
  });
});
