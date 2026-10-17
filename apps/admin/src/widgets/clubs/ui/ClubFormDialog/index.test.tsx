import { zodResolver } from '@hookform/resolvers/zod';
import type { Club } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  createClub,
  createStudent,
  http,
  renderWithProviders,
  screen,
  selectOption,
  server,
  toClubMember,
  waitFor,
  within,
} from '@repo/test-utils';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { AddClubSchema, AddClubType } from '@/entities/club';

import ClubFormDialog from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const students = [
  createStudent({ id: 1, name: '김부장', grade: 2, classNum: 1, number: 1 }),
  createStudent({ id: 2, name: '이팀원', grade: 2, classNum: 1, number: 2 }),
  createStudent({ id: 3, name: '박팀원', grade: 1, classNum: 2, number: 3 }),
];

/** ClubsPage와 같은 설정으로 폼을 만들어 넘긴다. */
const ClubFormDialogWithForm = (props: {
  mode: 'create' | 'edit';
  club?: Club;
  open?: boolean;
}) => {
  const form = useForm<AddClubType>({
    resolver: zodResolver(AddClubSchema),
    defaultValues: { name: '', status: 'ACTIVE', participantIds: [] },
  });
  return <ClubFormDialog {...props} students={students} form={form} onOpenChange={vi.fn()} />;
};

const mockClubApi = ({ save = () => apiSuccess(null) }: { save?: () => Response } = {}) => {
  const requests: { method: string; id?: unknown; body: unknown }[] = [];
  server.use(
    http.post(apiPath('/v1/clubs'), async ({ request }) => {
      requests.push({ method: 'POST', body: await request.json() });
      return save();
    }),
    http.put(apiPath('/v1/clubs/:id'), async ({ request, params }) => {
      requests.push({ method: 'PUT', id: params.id, body: await request.json() });
      return save();
    }),
  );
  return requests;
};

const dialog = () => screen.getByRole('dialog');
const field = (label: string) => within(dialog()).getByLabelText(label);

const pickStudent = async (user: User, comboboxLabel: string, optionText: string) => {
  await user.click(field(comboboxLabel));
  await user.click(await screen.findByRole('option', { name: optionText }));
};

const openCreateDialog = async () => {
  const view = renderWithProviders(<ClubFormDialogWithForm mode="create" />);
  await view.user.click(screen.getByRole('button', { name: '+ 동아리 추가' }));
  await screen.findByRole('dialog');
  return view;
};

describe('ClubFormDialog', () => {
  it('운영 중인 동아리를 부장·팀원과 함께 등록한다', { timeout: 15_000 }, async () => {
    const requests = mockClubApi();
    const { user } = await openCreateDialog();

    await user.type(field('동아리명'), '더모먼트');
    await selectOption(user, field('동아리 종류'), '전공');
    await user.type(field('설립연도'), '2021');
    await pickStudent(user, '부장', '2101 김부장');
    await pickStudent(user, '팀원', '2102 이팀원');
    await user.click(within(dialog()).getByRole('button', { name: '+ Add Club' }));

    expect(await screen.findByText('동아리 등록에 성공했습니다.')).toBeInTheDocument();
    expect(requests).toEqual([
      {
        method: 'POST',
        body: {
          name: '더모먼트',
          type: 'MAJOR_CLUB',
          status: 'ACTIVE',
          foundedYear: 2021,
          leaderId: 1,
          participantIds: [2],
        },
      },
    ]);
  });

  it('검증에 걸리면 요청하지 않고 첫 번째 에러를 토스트로 알린다', async () => {
    const requests = mockClubApi();
    const { user } = await openCreateDialog();

    await user.click(within(dialog()).getByRole('button', { name: '+ Add Club' }));

    expect(
      await screen.findByText('동아리명을 입력해주세요.', { selector: 'li *' }),
    ).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it(
    '팀원 선택지에서 부장은 빼고, 이미 팀원인 학생을 부장으로 고르면 팀원에서 뺀다',
    { timeout: 15_000 },
    async () => {
      mockClubApi();
      const { user } = await openCreateDialog();
      await pickStudent(user, '팀원', '2102 이팀원');
      expect(field('팀원')).toHaveTextContent('1명 선택됨');

      await pickStudent(user, '부장', '2102 이팀원');

      expect(field('팀원')).toHaveTextContent('팀원을 선택하세요');
      await user.click(field('팀원'));
      const options = (await screen.findAllByRole('option')).map((option) => option.textContent);
      expect(options).toEqual(['2101 김부장', '1203 박팀원']);
    },
  );

  it('팀원 검색은 이름과 학번으로 거른다', async () => {
    mockClubApi();
    const { user } = await openCreateDialog();
    await user.click(field('팀원'));

    await user.type(await screen.findByPlaceholderText('이름 또는 학번 검색...'), '1203');

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '1203 박팀원',
    ]);
  });

  it(
    '폐지 상태로 바꾸면 부장·팀원 입력을 숨기고 비운 채 폐지연도와 함께 보낸다',
    { timeout: 15_000 },
    async () => {
      const requests = mockClubApi();
      const { user } = await openCreateDialog();
      await user.type(field('동아리명'), '옛 동아리');
      await selectOption(user, field('동아리 종류'), '자율');
      await user.type(field('설립연도'), '2019');
      await pickStudent(user, '부장', '2101 김부장');

      await selectOption(user, field('운영 상태'), '폐지');
      expect(within(dialog()).queryByLabelText('부장')).not.toBeInTheDocument();
      await user.type(field('폐지연도'), '2024');
      await user.click(within(dialog()).getByRole('button', { name: '+ Add Club' }));

      await screen.findByText('동아리 등록에 성공했습니다.');
      expect(requests[0]?.body).toEqual({
        name: '옛 동아리',
        type: 'AUTONOMOUS_CLUB',
        status: 'ABOLISHED',
        foundedYear: 2019,
        abolishedYear: 2024,
        participantIds: [],
      });
    },
  );

  describe('수정', () => {
    const club = createClub({
      id: 9,
      name: '더모먼트',
      type: 'MAJOR_CLUB',
      foundedYear: 2021,
      leader: toClubMember(students[0]!),
      participants: [toClubMember(students[1]!)],
    });

    it('동아리 정보를 채워서 보여주고, 바꾼 내용을 해당 동아리로 저장한다', async () => {
      const requests = mockClubApi();
      const { user } = renderWithProviders(<ClubFormDialogWithForm mode="edit" club={club} open />);

      expect(
        await within(await screen.findByRole('dialog')).findByDisplayValue('더모먼트'),
      ).toBeInTheDocument();
      expect(field('부장')).toHaveTextContent('2101 김부장');
      expect(field('팀원')).toHaveTextContent('1명 선택됨');

      await user.clear(field('동아리명'));
      await user.type(field('동아리명'), '더모먼트팀');
      await user.click(within(dialog()).getByRole('button', { name: '수정' }));

      expect(await screen.findByText('동아리 데이터가 수정되었습니다.')).toBeInTheDocument();
      expect(requests).toEqual([
        {
          method: 'PUT',
          id: '9',
          body: expect.objectContaining({ name: '더모먼트팀', leaderId: 1, participantIds: [2] }),
        },
      ]);
    });

    it('저장에 실패하면 안내한다', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClubApi({ save: () => apiError(500, 'error') });
      const { user } = renderWithProviders(<ClubFormDialogWithForm mode="edit" club={club} open />);
      await within(await screen.findByRole('dialog')).findByDisplayValue('더모먼트');

      await user.click(within(dialog()).getByRole('button', { name: '수정' }));

      await waitFor(() =>
        expect(screen.getByText('동아리 데이터 수정에 실패했습니다.')).toBeInTheDocument(),
      );
    });
  });
});
