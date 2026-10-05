import {
  apiError,
  apiPath,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  selectOption,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { Client } from '@/entities/clients';

import ClientsPage from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const AVAILABLE_SCOPES = [
  { scope: 'datagsm:self_read', description: '내 정보 조회', applicationName: 'DataGSM' },
  { scope: 'meal:read', description: '급식 조회', applicationName: '급식 알리미' },
];

const existingClient: Client = {
  id: 'client-1',
  clientName: '기존 클라이언트',
  serviceName: '기존 서비스',
  redirectUrl: ['https://old.test/callback'],
  scopes: ['datagsm:self_read'],
};

const mockClientApi = ({
  clients = [] as Client[],
  create = () =>
    apiSuccess({
      clientId: 'new-client-id',
      clientSecret: 'new-client-secret',
      clientName: '새 클라이언트',
      serviceName: '새 서비스',
      redirectUrls: ['https://app.test/callback'],
      scopes: ['meal:read'],
    }),
  update = () => apiSuccess(existingClient),
}: { clients?: Client[]; create?: () => Response; update?: () => Response } = {}) => {
  const requests: { method: string; id?: unknown; body: unknown }[] = [];
  server.use(
    http.get(apiPath('/v1/clients/my'), () =>
      apiSuccess({ clients, totalPages: 1, totalElements: clients.length }),
    ),
    http.get(apiPath('/v1/clients/available-scopes'), () => apiSuccess({ list: AVAILABLE_SCOPES })),
    http.post(apiPath('/v1/clients'), async ({ request }) => {
      requests.push({ method: 'POST', body: await request.json() });
      return create();
    }),
    http.patch(apiPath('/v1/clients/:id'), async ({ request, params }) => {
      requests.push({ method: 'PATCH', id: params.id, body: await request.json() });
      return update();
    }),
  );
  return requests;
};

const openCreateDialog = async (user: User) => {
  const addButton = await screen.findByRole('button', { name: '클라이언트 추가' });
  await vi.waitFor(() => expect(addButton).toBeEnabled());
  await user.click(addButton);
  return within(await screen.findByRole('dialog'));
};

describe('ClientsPage', () => {
  it('권한 범위를 애플리케이션별로 묶어 보여주고, 애플리케이션으로 거를 수 있다', async () => {
    mockClientApi();
    const { user } = renderWithProviders(<ClientsPage />);
    const dialog = await openCreateDialog(user);

    expect(dialog.getByRole('heading', { name: 'DataGSM' })).toBeInTheDocument();
    expect(dialog.getByRole('heading', { name: '급식 알리미' })).toBeInTheDocument();
    // 권한 이름은 콜론 뒤만 보여준다.
    expect(dialog.getByText('self_read')).toBeInTheDocument();

    await selectOption(user, dialog.getByRole('combobox'), '급식 알리미');

    expect(dialog.queryByRole('heading', { name: 'DataGSM' })).not.toBeInTheDocument();
    expect(dialog.getByRole('heading', { name: '급식 알리미' })).toBeInTheDocument();
  });

  it('빈 값으로 추가하면 항목별 에러를 보여주고 요청하지 않는다', async () => {
    const requests = mockClientApi();
    const { user } = renderWithProviders(<ClientsPage />);
    const dialog = await openCreateDialog(user);

    await user.click(dialog.getByRole('button', { name: '추가' }));

    expect(await dialog.findByText('클라이언트 이름을 입력해주세요.')).toBeInTheDocument();
    expect(dialog.getByText('올바른 URL 형식이 아닙니다.')).toBeInTheDocument();
    expect(dialog.getByText('최소 한 개 이상의 권한 범위를 선택해주세요.')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('리다이렉트 URL 여러 개와 권한을 담아 추가하고, 클라이언트 ID와 시크릿을 보여준다', async () => {
    const requests = mockClientApi();
    const { user } = renderWithProviders(<ClientsPage />);
    const dialog = await openCreateDialog(user);

    await user.type(dialog.getByLabelText('클라이언트 이름'), '새 클라이언트');
    await user.type(dialog.getByLabelText('서비스 명칭'), '새 서비스');
    await user.click(dialog.getByRole('button', { name: 'URL 추가' }));
    const [firstUrl, secondUrl] = dialog.getAllByPlaceholderText('https://example.com/callback');
    await user.type(firstUrl!, 'https://app.test/callback');
    await user.type(secondUrl!, 'https://app.test/callback2');
    await user.click(dialog.getByRole('checkbox', { name: /급식 조회/ }));
    await user.click(dialog.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('클라이언트가 생성되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual([
      {
        method: 'POST',
        body: {
          clientName: '새 클라이언트',
          serviceName: '새 서비스',
          redirectUrls: ['https://app.test/callback', 'https://app.test/callback2'],
          scopes: ['meal:read'],
        },
      },
    ]);
    const successDialog = within(await screen.findByRole('dialog'));
    expect(successDialog.getByText('new-client-id')).toBeInTheDocument();
    expect(successDialog.getByText('new-client-secret')).toBeInTheDocument();
  });

  it('추가에 실패하면 안내한다', async () => {
    mockClientApi({ create: () => apiError(409, 'duplicated') });
    const { user } = renderWithProviders(<ClientsPage />);
    const dialog = await openCreateDialog(user);

    await user.type(dialog.getByLabelText('클라이언트 이름'), '새 클라이언트');
    await user.type(dialog.getByLabelText('서비스 명칭'), '새 서비스');
    await user.type(
      dialog.getByPlaceholderText('https://example.com/callback'),
      'https://app.test/cb',
    );
    await user.click(dialog.getByRole('checkbox', { name: /급식 조회/ }));
    await user.click(dialog.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('클라이언트 생성에 실패했습니다.')).toBeInTheDocument();
  });

  it('수정은 권한 범위 없이 이름·서비스명·리다이렉트 URL만 확인 후 저장한다', async () => {
    const requests = mockClientApi({ clients: [existingClient] });
    const { user } = renderWithProviders(<ClientsPage />);

    const row = (await screen.findByText('기존 클라이언트')).closest('tr')!;
    await user.click(
      within(row).getByRole('button', { name: '기존 클라이언트 (client-1) 클라이언트 수정' }),
    );
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('client-1')).toBeInTheDocument();
    expect(dialog.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.clear(dialog.getByLabelText('서비스 명칭'));
    await user.type(dialog.getByLabelText('서비스 명칭'), '바뀐 서비스');
    await user.click(dialog.getByRole('button', { name: '저장' }));
    expect(requests).toEqual([]);
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: '저장' }),
    );

    expect(await screen.findByText('클라이언트 데이터가 수정되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual([
      {
        method: 'PATCH',
        id: 'client-1',
        body: {
          clientName: '기존 클라이언트',
          serviceName: '바뀐 서비스',
          redirectUrls: ['https://old.test/callback'],
        },
      },
    ]);
  });

  it('이름이 같은 클라이언트가 여러 개 있어도 ID로 각 행의 버튼을 구분할 수 있다', async () => {
    const duplicateNamedClient: Client = {
      id: 'client-2',
      clientName: '기존 클라이언트',
      serviceName: '다른 서비스',
      redirectUrl: ['https://another.test/callback'],
      scopes: ['datagsm:self_read'],
    };
    const requests = mockClientApi({
      clients: [existingClient, duplicateNamedClient],
      update: () => apiSuccess(duplicateNamedClient),
    });
    const { user } = renderWithProviders(<ClientsPage />);

    await screen.findByText('client-1');
    await screen.findByText('client-2');

    expect(
      screen.getByRole('button', { name: '기존 클라이언트 (client-1) 클라이언트 ID 복사' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '기존 클라이언트 (client-2) 클라이언트 ID 복사' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '기존 클라이언트 (client-1) 클라이언트 삭제' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '기존 클라이언트 (client-2) 클라이언트 삭제' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '기존 클라이언트 (client-2) 클라이언트 수정' }),
    );
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('client-2')).toBeInTheDocument();

    await user.clear(dialog.getByLabelText('서비스 명칭'));
    await user.type(dialog.getByLabelText('서비스 명칭'), '바뀐 서비스2');
    await user.click(dialog.getByRole('button', { name: '저장' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: '저장' }),
    );

    expect(await screen.findByText('클라이언트 데이터가 수정되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual([
      {
        method: 'PATCH',
        id: 'client-2',
        body: {
          clientName: '기존 클라이언트',
          serviceName: '바뀐 서비스2',
          redirectUrls: ['https://another.test/callback'],
        },
      },
    ]);
  });
});
