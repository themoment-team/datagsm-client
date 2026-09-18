import type { Student } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  createClubListData,
  createStudent,
  createStudentListData,
  delay,
  http,
  renderWithProviders,
  screen,
  server,
  setMockSearchParams,
  waitFor,
  within,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import StudentsPage from '.';

const PAGE_SIZE = 10;

/** 서버처럼 page·size 쿼리에 맞춰 잘라 준다. 전체 선택은 size=1000으로 필터 전체를 받아 간다. */
const mockStudents = (students: Student[]) => {
  const requestedSizes: number[] = [];
  server.use(
    http.get(apiPath('/v1/students'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page') ?? 0);
      const size = Number(params.get('size') ?? PAGE_SIZE);
      requestedSizes.push(size);

      return apiSuccess(
        createStudentListData(students.slice(page * size, (page + 1) * size), {
          totalPages: Math.ceil(students.length / size),
          totalElements: students.length,
        }),
      );
    }),
    http.get(apiPath('/v1/clubs'), () => apiSuccess(createClubListData([]))),
  );
  return requestedSizes;
};

const mockDataEditRequest = (
  respond: () => Response | Promise<Response> = () => apiSuccess(null),
) => {
  const bodies: unknown[] = [];
  server.use(
    http.post(apiPath('/v1/students/data-edit-requests'), async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return bodies;
};

const createStudents = (count: number) =>
  Array.from({ length: count }, (_, index) => createStudent({ name: `학생${index + 1}` }));

const setup = async () => {
  const view = renderWithProviders(<StudentsPage />);
  await screen.findByRole('cell', { name: '학생1' });
  return view;
};

describe('StudentsPage 컬럼 초기화', () => {
  it('컬럼 초기화 모드에 들어가면 선택 체크박스를 보여주고, 취소하면 원래대로 돌아온다', async () => {
    mockStudents(createStudents(3));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: '컬럼 초기화' }));

    expect(screen.getByRole('checkbox', { name: '학생1 선택' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '컬럼 초기화 진행' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '컬럼 초기화 취소' }));

    expect(screen.queryByRole('checkbox', { name: '학생1 선택' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(3);
  });

  it('페이지를 넘겨도 앞 페이지에서 고른 학생을 유지한다', async () => {
    mockStudents(createStudents(15));
    const { user, rerender } = await setup();
    await user.click(screen.getByRole('button', { name: '컬럼 초기화' }));
    await user.click(screen.getByRole('checkbox', { name: '학생2 선택' }));

    setMockSearchParams({ page: '1' });
    rerender(<StudentsPage />);
    await user.click(await screen.findByRole('checkbox', { name: '학생12 선택' }));
    await user.click(screen.getByRole('button', { name: '컬럼 초기화 진행' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('학생2')).toBeInTheDocument();
    expect(within(dialog).getByText('학생12')).toBeInTheDocument();
  });

  it('전체선택은 현재 페이지가 아니라 필터에 걸리는 학생 전체를 고르고, 다시 누르면 모두 푼다', async () => {
    const requestedSizes = mockStudents(createStudents(15));
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: '컬럼 초기화' }));

    const selectAll = screen.getByRole('checkbox', { name: '전체선택' });
    await waitFor(() => expect(selectAll).toBeEnabled());
    expect(requestedSizes).toContain(1000);

    await user.click(selectAll);
    expect(selectAll).toBeChecked();
    await user.click(screen.getByRole('button', { name: '컬럼 초기화 진행' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('학생15')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '이전으로' }));
    await user.click(selectAll);
    expect(selectAll).not.toBeChecked();
    expect(screen.getByRole('button', { name: '컬럼 초기화 진행' })).toBeDisabled();
  });

  const confirmFields = async (user: Awaited<ReturnType<typeof setup>>['user']) => {
    await user.click(screen.getByRole('button', { name: '컬럼 초기화 진행' }));
    await user.click(await screen.findByRole('button', { name: 'Column Refresh' }));
    await user.click(screen.getByRole('checkbox', { name: /기숙사 호실/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: '확인' }),
    );
  };

  it('고른 학생과 컬럼으로 요청하고, 성공하면 안내 후 기본 모드로 돌아간다', async () => {
    const students = createStudents(3);
    mockStudents(students);
    const bodies = mockDataEditRequest();
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: '컬럼 초기화' }));
    await user.click(screen.getByRole('checkbox', { name: '학생1 선택' }));
    await user.click(screen.getByRole('checkbox', { name: '학생3 선택' }));

    await confirmFields(user);

    expect(await screen.findByText('선택한 학생들의 컬럼을 초기화했습니다.')).toBeInTheDocument();
    expect(bodies).toEqual([
      { studentIds: [students[0]!.id, students[2]!.id], fields: ['DORMITORY_ROOM_NUMBER'] },
    ]);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('checkbox', { name: '학생1 선택' })).not.toBeInTheDocument();
  });

  it('요청이 끝나기 전에는 같은 초기화를 다시 보낼 수 없다', async () => {
    mockStudents(createStudents(3));
    const bodies = mockDataEditRequest(async () => {
      await delay(200);
      return apiSuccess(null);
    });
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: '컬럼 초기화' }));
    await user.click(screen.getByRole('checkbox', { name: '학생1 선택' }));

    await confirmFields(user);

    expect(await screen.findByRole('button', { name: 'Next' })).toBeDisabled();
    await screen.findByText('선택한 학생들의 컬럼을 초기화했습니다.');
    expect(bodies).toHaveLength(1);
  });

  it('요청이 실패하면 안내하고 고른 학생과 창을 그대로 둔다', async () => {
    mockStudents(createStudents(3));
    mockDataEditRequest(() => apiError(500, 'error'));
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: '컬럼 초기화' }));
    await user.click(screen.getByRole('checkbox', { name: '학생1 선택' }));

    await confirmFields(user);

    expect(
      await screen.findByText('컬럼 초기화에 실패했습니다. 다시 시도해주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // 모달이 열려 있어 뒤쪽 목록은 접근성 트리에서 숨겨져 있다.
    expect(screen.getByRole('checkbox', { name: '학생1 선택', hidden: true })).toBeChecked();
  });
});
