import type { MyAccount, Student } from '@repo/shared/types';
import {
  apiError,
  apiPath,
  apiSuccess,
  createClub,
  createMyAccount,
  createStudent,
  http,
  renderWithProviders,
  screen,
  selectOption,
  server,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ProfileInfo } from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const accountWith = (student: Partial<Student> = {}): MyAccount =>
  createMyAccount({
    student: createStudent({
      name: '홍길동',
      grade: 2,
      classNum: 1,
      number: 3,
      dormitoryFloor: 3,
      dormitoryRoom: 305,
      majorClub: createClub({ name: '더모먼트' }),
      specialty: null,
      githubId: null,
      ...student,
    }),
  });

const mockProfileApi = ({
  specialty = () => apiSuccess(null),
  githubId = () => apiSuccess(null),
}: { specialty?: () => Response; githubId?: () => Response } = {}) => {
  const requests: { path: string; body: unknown }[] = [];
  server.use(
    http.patch(apiPath('/v1/students/me/specialty'), async ({ request }) => {
      requests.push({ path: 'specialty', body: await request.json() });
      return specialty();
    }),
    http.patch(apiPath('/v1/students/me/github-id'), async ({ request }) => {
      requests.push({ path: 'github-id', body: await request.json() });
      return githubId();
    }),
  );
  return requests;
};

describe('ProfileInfo', () => {
  it('학적·기숙사·동아리 정보를 보여준다', () => {
    renderWithProviders(<ProfileInfo data={accountWith()} />);

    expect(screen.getByText('2학년')).toBeInTheDocument();
    expect(screen.getByText('1반')).toBeInTheDocument();
    expect(screen.getByText('3층 305호')).toBeInTheDocument();
    expect(screen.getByText('더모먼트')).toBeInTheDocument();
    // 진로와 GitHub가 비어 있으면 둘 다 미설정으로 보여준다.
    expect(screen.getAllByText('// 미설정')).toHaveLength(2);
  });

  it('졸업생은 학년·반·기숙사·동아리를 -로 가리고 수정할 수 없다', () => {
    renderWithProviders(<ProfileInfo data={accountWith({ role: 'GRADUATE' })} />);

    expect(screen.queryByText('2학년')).not.toBeInTheDocument();
    expect(screen.queryByText('3층 305호')).not.toBeInTheDocument();
    expect(screen.queryByText('더모먼트')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '진로 정보 수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'GitHub ID 수정' })).not.toBeInTheDocument();
  });

  describe('진로 정보', () => {
    const startEdit = (user: User) =>
      user.click(screen.getByRole('button', { name: '진로 정보 수정' }));

    it('목록에서 고른 진로로 저장한다', async () => {
      const requests = mockProfileApi();
      const { user } = renderWithProviders(<ProfileInfo data={accountWith()} />);
      await startEdit(user);

      await selectOption(user, screen.getByRole('combobox'), '백엔드');
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(await screen.findByText('전공이 수정되었습니다.')).toBeInTheDocument();
      expect(requests).toEqual([{ path: 'specialty', body: { specialty: '백엔드' } }]);
      expect(screen.getByRole('button', { name: '진로 정보 수정' })).toBeInTheDocument();
    });

    it('직접 입력한 진로는 앞뒤 공백을 지우고, 비우면 null로 저장한다', async () => {
      const requests = mockProfileApi();
      const { user } = renderWithProviders(<ProfileInfo data={accountWith()} />);
      await startEdit(user);

      await selectOption(user, screen.getByRole('combobox'), '직접 입력...');
      await user.type(screen.getByPlaceholderText('진로 직접 입력'), '  게임 개발  ');
      await user.click(screen.getByRole('button', { name: '저장' }));
      await screen.findByText('전공이 수정되었습니다.');

      await startEdit(user);
      await selectOption(user, screen.getByRole('combobox'), '직접 입력...');
      await user.click(screen.getByRole('button', { name: '저장' }));

      await vi.waitFor(() => expect(requests).toHaveLength(2));
      expect(requests.map(({ body }) => body)).toEqual([
        { specialty: '게임 개발' },
        { specialty: null },
      ]);
    });

    it('목록에 없는 진로는 직접 입력 칸에 채워서 연다', async () => {
      mockProfileApi();
      const { user } = renderWithProviders(
        <ProfileInfo data={accountWith({ specialty: '게임 개발' })} />,
      );

      await startEdit(user);

      expect(screen.getByPlaceholderText('진로 직접 입력')).toHaveValue('게임 개발');
    });

    it('선택 안 함으로 저장하면 null을 보내고, 취소하면 요청하지 않는다', async () => {
      const requests = mockProfileApi();
      const { user } = renderWithProviders(<ProfileInfo data={accountWith({ specialty: 'AI' })} />);

      await startEdit(user);
      await user.click(screen.getByRole('button', { name: '취소' }));
      expect(requests).toEqual([]);

      await startEdit(user);
      await selectOption(user, screen.getByRole('combobox'), '선택 안 함');
      await user.click(screen.getByRole('button', { name: '저장' }));

      await screen.findByText('전공이 수정되었습니다.');
      expect(requests).toEqual([{ path: 'specialty', body: { specialty: null } }]);
    });

    it('저장에 실패하면 안내하고 편집 상태를 유지한다', async () => {
      mockProfileApi({ specialty: () => apiError(400, 'error') });
      const { user } = renderWithProviders(<ProfileInfo data={accountWith()} />);
      await startEdit(user);

      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(await screen.findByText('전공 수정에 실패했습니다.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });
  });

  describe('GitHub', () => {
    it('등록된 아이디는 GitHub 프로필 링크로 보여준다', () => {
      renderWithProviders(<ProfileInfo data={accountWith({ githubId: 'gildong' })} />);

      expect(screen.getByRole('link', { name: 'gildong' })).toHaveAttribute(
        'href',
        'https://github.com/gildong',
      );
    });

    it('앞뒤 공백을 지운 아이디로 저장하고, 비우면 null로 저장한다', async () => {
      const requests = mockProfileApi();
      const { user } = renderWithProviders(<ProfileInfo data={accountWith({ githubId: 'old' })} />);

      await user.click(screen.getByRole('button', { name: 'GitHub ID 수정' }));
      const input = screen.getByPlaceholderText('GitHub 아이디 입력');
      expect(input).toHaveValue('old');
      await user.clear(input);
      await user.type(input, '  gildong ');
      await user.click(screen.getByRole('button', { name: '저장' }));
      await screen.findByText('GitHub ID가 수정되었습니다.');

      await user.click(screen.getByRole('button', { name: 'GitHub ID 수정' }));
      await user.clear(screen.getByPlaceholderText('GitHub 아이디 입력'));
      await user.click(screen.getByRole('button', { name: '저장' }));

      await vi.waitFor(() => expect(requests).toHaveLength(2));
      expect(requests.map(({ body }) => body)).toEqual([
        { githubId: 'gildong' },
        { githubId: null },
      ]);
    });

    it('저장에 실패하면 안내한다', async () => {
      mockProfileApi({ githubId: () => apiError(409, 'duplicated') });
      const { user } = renderWithProviders(<ProfileInfo data={accountWith()} />);

      await user.click(screen.getByRole('button', { name: 'GitHub ID 수정' }));
      await user.type(screen.getByPlaceholderText('GitHub 아이디 입력'), 'gildong');
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(await screen.findByText('GitHub ID 수정에 실패했습니다.')).toBeInTheDocument();
    });
  });
});
