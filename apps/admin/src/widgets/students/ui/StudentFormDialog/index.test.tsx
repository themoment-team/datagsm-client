import type { Student } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  createClub,
  createClubListData,
  createStudent,
  expectNoRequest,
  http,
  renderWithProviders,
  screen,
  selectOption,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import StudentFormDialog from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const majorClub = createClub({ id: 31, name: '더모먼트', type: 'MAJOR_CLUB' });
const autonomousClub = createClub({ id: 32, name: '코딩부', type: 'AUTONOMOUS_CLUB' });
const clubs = createClubListData([majorClub, autonomousClub]);

const mockStudentApi = ({
  create = () => apiSuccess(null),
  update = () => apiSuccess(null),
  updateStatus = () => apiSuccess(null),
}: {
  create?: () => Response;
  update?: () => Response;
  updateStatus?: () => Response;
} = {}) => {
  const requests = {
    create: [] as unknown[],
    update: [] as unknown[],
    updateStatus: [] as unknown[],
  };
  server.use(
    http.post(apiPath('/v1/students'), async ({ request }) => {
      requests.create.push(await request.json());
      return create();
    }),
    http.put(apiPath('/v1/students/:id'), async ({ request, params }) => {
      requests.update.push({ id: params.id, body: await request.json() });
      return update();
    }),
    http.patch(apiPath('/v1/students/:id/status'), async ({ request, params }) => {
      requests.updateStatus.push({ id: params.id, body: await request.json() });
      return updateStatus();
    }),
  );
  return requests;
};

const dialog = () => screen.getByRole('dialog');
const field = (label: string) => within(dialog()).getByLabelText(label);

describe('StudentFormDialog 추가', () => {
  const openCreateDialog = async () => {
    const view = renderWithProviders(<StudentFormDialog mode="create" clubs={clubs} />);
    await view.user.click(screen.getByRole('button', { name: '+ 학생 추가' }));
    await screen.findByRole('dialog');
    return view;
  };

  const fillRequired = async (user: User) => {
    await user.type(field('이름'), '홍길동');
    await user.type(field('이메일'), 's25001@gsm.hs.kr');
    await selectOption(user, field('성별'), '여');
    await selectOption(user, field('구분'), '일반학생');
    await selectOption(user, field('반'), '3반');
    await selectOption(user, field('학년'), '2학년');
    await user.type(field('기숙사 호실'), '305');
    await user.type(field('번호'), '4');
    // 추가 모드에서는 동아리가 없어도 '선택 안 함'을 직접 골라야 검증을 통과한다.
    await selectOption(user, field('전공 동아리'), '선택 안 함');
    await selectOption(user, field('자율 동아리'), '선택 안 함');
  };

  it('동아리 선택지는 종류에 맞는 동아리만 보여준다', async () => {
    mockStudentApi();
    const { user } = await openCreateDialog();

    field('전공 동아리').focus();
    await user.keyboard('{ArrowDown}');

    const options = (await screen.findAllByRole('option')).map((option) => option.textContent);
    expect(options).toEqual(['선택 안 함', '더모먼트']);
  });

  it('빈 값으로 제출하면 요청하지 않고 항목별 에러를 보여준다', async () => {
    const requests = mockStudentApi();
    const { user } = await openCreateDialog();

    await user.click(within(dialog()).getByRole('button', { name: '+ Add Student' }));

    expect(await within(dialog()).findByText('이름을 입력해주세요.')).toBeInTheDocument();
    expect(within(dialog()).getByText('성별을 선택해주세요.')).toBeInTheDocument();
    expect(requests.create).toEqual([]);
  });

  it('입력한 학생을 등록하고 창을 닫는다', { timeout: 20_000 }, async () => {
    const requests = mockStudentApi();
    const { user } = await openCreateDialog();
    await fillRequired(user);
    await selectOption(user, field('전공 동아리'), '더모먼트');
    await selectOption(user, field('전공'), '백엔드');
    await user.type(field('Git Hub ID'), 'gildong');

    await user.click(within(dialog()).getByRole('button', { name: '+ Add Student' }));

    expect(await screen.findByText('학생 등록에 성공했습니다.')).toBeInTheDocument();
    expect(requests.create).toEqual([
      {
        name: '홍길동',
        email: 's25001@gsm.hs.kr',
        sex: 'WOMAN',
        role: 'GENERAL_STUDENT',
        classNum: 3,
        grade: 2,
        dormitoryRoomNumber: 305,
        number: 4,
        majorClubId: 31,
        autonomousClubId: null,
        specialty: '백엔드',
        githubId: 'gildong',
      },
    ]);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('등록에 실패하면 안내하고 창을 그대로 둔다', { timeout: 20_000 }, async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStudentApi({ create: () => apiError(409, '중복') });
    const { user } = await openCreateDialog();
    await fillRequired(user);

    await user.click(within(dialog()).getByRole('button', { name: '+ Add Student' }));

    expect(await screen.findByText('학생 등록에 실패했습니다.')).toBeInTheDocument();
    expect(dialog()).toBeInTheDocument();
  });

  it('전공을 직접 입력할 수 있고, 취소하면 선택 목록으로 돌아간다', async () => {
    mockStudentApi();
    const { user } = await openCreateDialog();

    await selectOption(user, field('전공'), '직접 입력...');
    await user.type(within(dialog()).getByPlaceholderText('전공을 입력하세요'), '게임 개발');

    expect(within(dialog()).getByPlaceholderText('전공을 입력하세요')).toHaveValue('게임 개발');

    await user.click(within(dialog()).getByRole('button', { name: '취소' }));

    expect(within(dialog()).queryByPlaceholderText('전공을 입력하세요')).not.toBeInTheDocument();
    expect(field('전공')).toHaveTextContent('선택 안 함');
  });

  // 졸업생·자퇴생은 학년·반 등을 숨기지만 검증은 그대로라, 에러도 보이지 않고 요청도 나가지 않는다.
  // 현재 동작을 기록한다. 개선 이슈: #221
  it('졸업생으로 추가하려 하면 숨겨진 항목 때문에 요청이 나가지 않는다', async () => {
    const requests = mockStudentApi();
    const { user } = await openCreateDialog();
    await user.type(field('이름'), '졸업생');
    await user.type(field('이메일'), 'grad@gsm.hs.kr');
    await selectOption(user, field('성별'), '남');
    await selectOption(user, field('구분'), '졸업생');

    expect(within(dialog()).queryByLabelText('학년')).not.toBeInTheDocument();

    await user.click(within(dialog()).getByRole('button', { name: '+ Add Student' }));

    await expectNoRequest(() => requests.create.length);
  });
});

describe('StudentFormDialog 수정', () => {
  const student = createStudent({
    id: 7,
    name: '홍길동',
    grade: 2,
    classNum: 1,
    number: 3,
    role: 'GENERAL_STUDENT',
    dormitoryRoom: 305,
    specialty: '게임 개발',
    majorClub: majorClub,
    autonomousClub: null,
  });

  const openEditDialog = (target: Student = student) => {
    const onOpenChange = vi.fn();
    const view = renderWithProviders(
      <StudentFormDialog
        mode="edit"
        student={target}
        clubs={clubs}
        open
        onOpenChange={onOpenChange}
      />,
    );
    return { ...view, onOpenChange };
  };

  it('학생의 현재 정보를 채워서 보여준다', async () => {
    mockStudentApi();
    openEditDialog();

    expect(await screen.findByDisplayValue('홍길동')).toBeInTheDocument();
    expect(field('학년')).toHaveTextContent('2학년');
    expect(field('전공 동아리')).toHaveTextContent('더모먼트');
    expect(field('자율 동아리')).toHaveTextContent('선택 안 함');
    // 목록에 없는 전공은 직접 입력 칸으로 보여준다.
    expect(within(dialog()).getByPlaceholderText('전공을 입력하세요')).toHaveValue('게임 개발');
    expect(within(dialog()).getByRole('button', { name: '수정' })).toBeInTheDocument();
  });

  it('구분 외의 정보만 바꾸면 상태 변경 없이 정보만 수정한다', async () => {
    const requests = mockStudentApi();
    const { user, onOpenChange } = openEditDialog();
    await user.clear(await screen.findByDisplayValue('홍길동'));
    await user.type(field('이름'), '홍길순');

    await user.click(within(dialog()).getByRole('button', { name: '수정' }));

    expect(await screen.findByText('학생 데이터가 수정되었습니다.')).toBeInTheDocument();
    expect(requests.updateStatus).toEqual([]);
    expect(requests.update).toEqual([
      {
        id: '7',
        body: expect.objectContaining({ name: '홍길순', majorClubId: 31, autonomousClubId: null }),
      },
    ]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('구분만 바꾸면 상태만 바꾼다', async () => {
    const requests = mockStudentApi();
    const { user, onOpenChange } = openEditDialog();
    await screen.findByDisplayValue('홍길동');

    await selectOption(user, field('구분'), '학생회');
    await user.click(within(dialog()).getByRole('button', { name: '수정' }));

    expect(await screen.findByText('학생 상태가 수정되었습니다.')).toBeInTheDocument();
    expect(requests.updateStatus).toEqual([{ id: '7', body: { status: 'STUDENT_COUNCIL' } }]);
    expect(requests.update).toEqual([]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('졸업생 처리와 다른 정보 수정을 함께 하면 상태를 먼저 바꾸고 정보를 수정한다', async () => {
    const requests = mockStudentApi();
    const { user } = openEditDialog();
    await user.clear(await screen.findByDisplayValue('홍길동'));
    await user.type(field('이름'), '홍길순');

    await selectOption(user, field('구분'), '졸업생');
    expect(within(dialog()).queryByLabelText('학년')).not.toBeInTheDocument();
    await user.click(within(dialog()).getByRole('button', { name: '졸업생 처리' }));

    expect(await screen.findByText('학생 데이터가 수정되었습니다.')).toBeInTheDocument();
    expect(requests.updateStatus).toEqual([{ id: '7', body: { status: 'GRADUATE' } }]);
    expect(requests.update).toEqual([
      { id: '7', body: expect.objectContaining({ name: '홍길순', role: 'GRADUATE' }) },
    ]);
  });

  it('상태 변경이 실패하면 정보 수정 요청을 보내지 않는다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const requests = mockStudentApi({ updateStatus: () => apiError(500, 'error') });
    const { user } = openEditDialog();
    await user.clear(await screen.findByDisplayValue('홍길동'));
    await user.type(field('이름'), '홍길순');

    await selectOption(user, field('구분'), '자퇴생');
    await user.click(within(dialog()).getByRole('button', { name: '자퇴생 처리' }));

    expect(await screen.findByText('학생 상태 수정에 실패했습니다.')).toBeInTheDocument();
    expect(requests.update).toEqual([]);
  });

  it('정보 수정이 실패하면 안내하고 창을 그대로 둔다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStudentApi({ update: () => apiError(400, 'error') });
    const { user, onOpenChange } = openEditDialog();
    await user.clear(await screen.findByDisplayValue('홍길동'));
    await user.type(field('이름'), '홍길순');

    await user.click(within(dialog()).getByRole('button', { name: '수정' }));

    expect(await screen.findByText('학생 데이터 수정에 실패했습니다.')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  // 바뀐 값이 없으면 아무 요청도, 안내도 하지 않는다. 현재 동작을 기록한다. 개선 이슈: #221
  it('아무것도 바꾸지 않고 수정을 누르면 요청하지 않는다', async () => {
    const requests = mockStudentApi();
    const { user, onOpenChange } = openEditDialog();
    await screen.findByDisplayValue('홍길동');

    await user.click(within(dialog()).getByRole('button', { name: '수정' }));

    await expectNoRequest(
      () => requests.create.length + requests.update.length + requests.updateStatus.length,
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('GitHub ID를 지우면 빈 문자열 대신 null로 보낸다', async () => {
    const requests = mockStudentApi();
    const { user } = openEditDialog({ ...student, githubId: 'gildong' });
    await user.clear(await screen.findByDisplayValue('gildong'));

    await user.click(within(dialog()).getByRole('button', { name: '수정' }));

    await screen.findByText('학생 데이터가 수정되었습니다.');
    expect(requests.update).toEqual([
      { id: '7', body: expect.objectContaining({ githubId: null }) },
    ]);
  });
});
