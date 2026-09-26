import {
  createAccountListItem,
  createTeacher,
  render,
  screen,
  userEvent,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import TeacherApprovalList from '.';

const pendingTeacher = createAccountListItem({
  id: 41,
  email: 'teacher@gsm.hs.kr',
  status: 'PENDING',
  objectType: 'TEACHER',
  student: null,
  teacher: createTeacher({ name: '김선생', department: 'GRADE', description: '2학년 부장' }),
  createdAt: '2026-03-02T09:00:00+09:00',
});

describe('TeacherApprovalList', () => {
  it('대기 중인 계정이 없으면 빈 상태 문구를 보여준다', () => {
    render(<TeacherApprovalList accounts={[]} />);

    expect(screen.getByText('승인 대기 중인 선생님 계정이 없습니다.')).toBeInTheDocument();
  });

  it('신청한 선생님 정보를 보여주고, 없는 값은 -로 보여준다', () => {
    const withoutTeacher = createAccountListItem({
      email: 'unknown@gsm.hs.kr',
      student: null,
      teacher: null,
    });
    render(<TeacherApprovalList accounts={[pendingTeacher, withoutTeacher]} />);

    const [, firstRow, secondRow] = screen.getAllByRole('row');
    expect(
      within(firstRow!)
        .getAllByRole('cell')
        .slice(0, 5)
        .map((cell) => cell.textContent),
    ).toEqual(['teacher@gsm.hs.kr', '김선생', '학년부', '2학년 부장', '2026. 3. 2.']);
    expect(
      within(secondRow!)
        .getAllByRole('cell')
        .slice(1, 4)
        .map((cell) => cell.textContent),
    ).toEqual(['-', '-', '-']);
  });

  it('Allow를 누르고 확인해야 해당 계정 ID로 onApprove를 부른다', async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<TeacherApprovalList accounts={[pendingTeacher]} onApprove={onApprove} />);

    await user.click(screen.getByRole('button', { name: 'Allow' }));
    const alert = await screen.findByRole('alertdialog');
    expect(alert).toHaveTextContent('“teacher@gsm.hs.kr”의 요청을 허락할까요?');
    expect(onApprove).not.toHaveBeenCalled();

    await user.click(within(alert).getByRole('button', { name: '확인' }));

    expect(onApprove).toHaveBeenCalledWith(41);
  });

  it('승인 요청 중에는 Allow를 누를 수 없다', () => {
    render(<TeacherApprovalList accounts={[pendingTeacher]} isApproving />);

    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled();
  });

  // 거절(계정 삭제) API가 서버에 아직 없어 Delete 버튼을 비활성화한다. 연동 이슈: #223
  it('거절 API가 없어 Delete 버튼은 비활성화되어 있다', () => {
    render(<TeacherApprovalList accounts={[pendingTeacher]} />);

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
