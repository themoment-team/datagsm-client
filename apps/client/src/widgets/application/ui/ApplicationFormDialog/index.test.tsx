import {
  apiError,
  apiPath,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { Application } from '@/entities/application';

import ApplicationFormDialog from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const mockApplicationApi = (
  respond: { createScope?: () => Response; create?: () => Response } = {},
) => {
  const requests: string[] = [];
  const bodies: Record<string, unknown> = {};
  const record = async (key: string, request: Request) => {
    requests.push(key);
    const text = await request.text();
    if (text) bodies[key] = JSON.parse(text);
  };
  server.use(
    http.post(apiPath('/v1/applications'), async ({ request }) => {
      await record('POST /applications', request);
      return respond.create?.() ?? apiSuccess(null);
    }),
    http.patch(apiPath('/v1/applications/:id'), async ({ request, params }) => {
      await record(`PATCH /applications/${params.id}`, request);
      return apiSuccess(null);
    }),
    http.post(apiPath('/v1/applications/:id/scopes'), async ({ request, params }) => {
      await record(`POST /applications/${params.id}/scopes`, request);
      return respond.createScope?.() ?? apiSuccess(null);
    }),
    http.patch(apiPath('/v1/applications/:id/scopes/:scopeId'), async ({ request, params }) => {
      await record(`PATCH /applications/${params.id}/scopes/${params.scopeId}`, request);
      return apiSuccess(null);
    }),
    http.delete(apiPath('/v1/applications/:id/scopes/:scopeId'), async ({ request, params }) => {
      await record(`DELETE /applications/${params.id}/scopes/${params.scopeId}`, request);
      return apiSuccess(null);
    }),
  );
  return { requests, bodies };
};

const scopeInputs = (dialog: ReturnType<typeof within>) => ({
  names: dialog.getAllByPlaceholderText('예: user_read') as HTMLInputElement[],
  descriptions: dialog.getAllByPlaceholderText('권한에 대한 설명 입력') as HTMLInputElement[],
});

describe('ApplicationFormDialog 추가', () => {
  const openCreateDialog = async () => {
    const view = renderWithProviders(<ApplicationFormDialog mode="create" />);
    await view.user.click(screen.getByRole('button'));
    return { ...view, dialog: within(await screen.findByRole('dialog')) };
  };

  it('이름과 권한 범위를 요청 형식으로 바꿔 추가한다', async () => {
    const { requests, bodies } = mockApplicationApi();
    const { user, dialog } = await openCreateDialog();

    await user.type(dialog.getByLabelText(/이름/), '급식 알리미');
    await user.type(scopeInputs(dialog).names[0]!, 'meal:read');
    await user.type(scopeInputs(dialog).descriptions[0]!, '급식 조회');
    await user.click(dialog.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('애플리케이션이 생성되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual(['POST /applications']);
    expect(bodies['POST /applications']).toEqual({
      name: '급식 알리미',
      scopes: [{ scopeName: 'meal:read', description: '급식 조회' }],
    });
  });

  it('빈 권한 범위는 항목별 에러를 보여주고 요청하지 않는다', async () => {
    const { requests } = mockApplicationApi();
    const { user, dialog } = await openCreateDialog();

    await user.click(dialog.getByRole('button', { name: '추가' }));

    expect(await dialog.findByText('애플리케이션 이름을 입력해주세요.')).toBeInTheDocument();
    expect(dialog.getByText('권한 범위를 입력해주세요.')).toBeInTheDocument();
    expect(dialog.getByText('권한 설명을 입력해주세요.')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('실패하면 서버가 준 메시지를 보여준다', async () => {
    mockApplicationApi({ create: () => apiError(409, '이미 존재하는 애플리케이션입니다.') });
    const { user, dialog } = await openCreateDialog();

    await user.type(dialog.getByLabelText(/이름/), '급식 알리미');
    await user.type(scopeInputs(dialog).names[0]!, 'meal:read');
    await user.type(scopeInputs(dialog).descriptions[0]!, '급식 조회');
    await user.click(dialog.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('이미 존재하는 애플리케이션입니다.')).toBeInTheDocument();
  });
});

describe('ApplicationFormDialog 수정', () => {
  const application: Application = {
    id: 'app-1',
    applicationName: '급식 알리미',
    accountId: 1,
    applicationScopes: [
      { scopeId: 11, applicationScope: 'meal:read', applicationDescription: '급식 조회' },
      { scopeId: 12, applicationScope: 'meal:write', applicationDescription: '급식 등록' },
    ],
  };

  const openEditDialog = async () => {
    const onOpenChange = vi.fn();
    const view = renderWithProviders(
      <ApplicationFormDialog
        mode="edit"
        application={application}
        open
        onOpenChange={onOpenChange}
      />,
    );
    const dialog = within(await screen.findByRole('dialog'));
    await dialog.findByDisplayValue('meal:write');
    return { ...view, dialog, onOpenChange };
  };

  const save = (user: User, dialog: ReturnType<typeof within>) =>
    user.click(dialog.getByRole('button', { name: '저장' }));

  it('바뀐 것이 없으면 요청 없이 변경사항이 없다고 알리고 닫는다', async () => {
    const { requests } = mockApplicationApi();
    const { user, dialog, onOpenChange } = await openEditDialog();

    await save(user, dialog);

    expect(await screen.findByText('변경사항이 없습니다.')).toBeInTheDocument();
    expect(requests).toEqual([]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('공백만 달라진 값은 바뀌지 않은 것으로 본다', async () => {
    const { requests } = mockApplicationApi();
    const { user, dialog } = await openEditDialog();

    await user.type(scopeInputs(dialog).descriptions[0]!, '  ');
    await save(user, dialog);

    await screen.findByText('변경사항이 없습니다.');
    expect(requests).toEqual([]);
  });

  it('지운 권한을 먼저 삭제한 뒤 이름 변경·권한 수정·권한 추가를 보낸다', async () => {
    const { requests, bodies } = mockApplicationApi();
    const { user, dialog } = await openEditDialog();

    await user.type(dialog.getByLabelText(/이름/), ' v2');
    await user.clear(scopeInputs(dialog).descriptions[0]!);
    await user.type(scopeInputs(dialog).descriptions[0]!, '오늘 급식 조회');
    // 두 번째 권한(meal:write) 삭제
    const removeButtons = dialog
      .getAllByRole('button')
      .filter((button) => !button.textContent?.trim());
    await user.click(removeButtons[1]!);
    await user.click(dialog.getByRole('button', { name: /권한 추가|추가/ }));
    await user.type(scopeInputs(dialog).names[1]!, 'meal:like');
    await user.type(scopeInputs(dialog).descriptions[1]!, '급식 평가');
    await save(user, dialog);

    expect(await screen.findByText('애플리케이션이 수정되었습니다.')).toBeInTheDocument();
    expect(requests[0]).toBe('DELETE /applications/app-1/scopes/12');
    expect(requests.slice(1).sort()).toEqual(
      [
        'PATCH /applications/app-1',
        'PATCH /applications/app-1/scopes/11',
        'POST /applications/app-1/scopes',
      ].sort(),
    );
    expect(bodies).toMatchObject({
      'PATCH /applications/app-1': { name: '급식 알리미 v2' },
      'PATCH /applications/app-1/scopes/11': {
        scopeName: 'meal:read',
        description: '오늘 급식 조회',
      },
      'POST /applications/app-1/scopes': { scopeName: 'meal:like', description: '급식 평가' },
    });
  });

  it('일부 요청이 실패하면 서버 메시지를 보여주고 창을 닫지 않는다', async () => {
    mockApplicationApi({ createScope: () => apiError(409, '이미 있는 권한입니다.') });
    const { user, dialog, onOpenChange } = await openEditDialog();

    await user.click(dialog.getByRole('button', { name: /권한 추가|추가/ }));
    await user.type(scopeInputs(dialog).names[2]!, 'meal:read');
    await user.type(scopeInputs(dialog).descriptions[2]!, '중복');
    await save(user, dialog);

    expect(await screen.findByText('이미 있는 권한입니다.')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
