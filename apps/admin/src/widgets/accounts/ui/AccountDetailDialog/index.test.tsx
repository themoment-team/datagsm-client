import type { AccountListItem } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  createAccountListItem,
  createClub,
  createStudent,
  createTeacher,
  http,
  renderWithProviders,
  screen,
  selectOption,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import AccountDetailDialog from '.';

const MY_ACCOUNT_ID = 1;

const mockAccountApi = ({
  updateRole = () => apiSuccess(null),
}: { updateRole?: () => Response } = {}) => {
  const requests: unknown[] = [];
  server.use(
    http.get(apiPath('/v1/accounts/my'), () => apiSuccess({ id: MY_ACCOUNT_ID })),
    http.patch(apiPath('/v1/accounts/:id/role'), async ({ request, params }) => {
      requests.push({ id: params.id, body: await request.json() });
      return updateRole();
    }),
  );
  return requests;
};

const setup = (account: AccountListItem) => {
  const onOpenChange = vi.fn();
  const view = renderWithProviders(
    <AccountDetailDialog account={account} open onOpenChange={onOpenChange} />,
  );
  return { ...view, onOpenChange, dialog: screen.getByRole('dialog') };
};

describe('AccountDetailDialog', () => {
  it('학생 계정이면 연동된 학생 정보를 보여준다', () => {
    mockAccountApi();
    const student = createStudent({
      name: '홍길동',
      grade: 2,
      classNum: 1,
      number: 3,
      dormitoryFloor: 3,
      dormitoryRoom: 305,
      majorClub: createClub({ name: '더모먼트' }),
    });
    const { dialog } = setup(createAccountListItem({ id: 20, student }));

    expect(within(dialog).getByText('연동된 학생 정보')).toBeInTheDocument();
    expect(within(dialog).getByText('2학년')).toBeInTheDocument();
    expect(within(dialog).getByText('3층 305호')).toBeInTheDocument();
    expect(within(dialog).getByText('더모먼트')).toBeInTheDocument();
  });

  it('선생님 계정이면 연동된 선생님 정보를 보여준다', () => {
    mockAccountApi();
    const { dialog } = setup(
      createAccountListItem({
        id: 21,
        objectType: 'TEACHER',
        student: null,
        teacher: createTeacher({ name: '김선생', department: 'DORMITORY', description: null }),
      }),
    );

    expect(within(dialog).getByText('연동된 선생님 정보')).toBeInTheDocument();
    expect(within(dialog).getByText('김선생')).toBeInTheDocument();
    expect(within(dialog).getByText('사감선생님')).toBeInTheDocument();
  });

  it('권한을 바꾸기 전에는 Confirm을 누를 수 없다', async () => {
    mockAccountApi();
    const { dialog } = setup(createAccountListItem({ id: 20, role: 'USER' }));

    expect(await within(dialog).findByRole('combobox')).toHaveTextContent('유저');
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('권한을 바꾸면 해당 계정으로 요청하고 창을 닫는다', async () => {
    const requests = mockAccountApi();
    const { user, dialog, onOpenChange } = setup(createAccountListItem({ id: 20, role: 'USER' }));

    await selectOption(user, within(dialog).getByLabelText('권한 변경'), '어드민');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('계정 권한이 변경되었습니다.')).toBeInTheDocument();
    expect(requests).toEqual([{ id: '20', body: { role: 'ADMIN' } }]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('권한 변경에 실패하면 안내하고 창을 그대로 둔다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAccountApi({ updateRole: () => apiError(403, 'forbidden') });
    const { user, dialog, onOpenChange } = setup(createAccountListItem({ id: 20, role: 'ADMIN' }));

    await selectOption(user, within(dialog).getByLabelText('권한 변경'), '유저');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('계정 권한 변경에 실패했습니다.')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('루트 계정은 권한을 바꿀 수 없다', () => {
    mockAccountApi();
    const { dialog } = setup(createAccountListItem({ id: 30, role: 'ROOT' }));

    expect(within(dialog).getByText('루트 계정의 권한은 변경할 수 없습니다.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('본인 계정은 권한을 바꿀 수 없다', async () => {
    mockAccountApi();
    const { dialog } = setup(createAccountListItem({ id: MY_ACCOUNT_ID, role: 'ADMIN' }));

    expect(
      await within(dialog).findByText('본인의 권한은 변경할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });
});
