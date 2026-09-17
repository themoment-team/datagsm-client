import { createStudent, render, screen, userEvent, within } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ColumnRefreshDialog from '.';

const students = [
  createStudent({ name: '김철수', grade: 1, classNum: 1, number: 1 }),
  createStudent({ name: '이영희', grade: 2, classNum: 3, number: 4 }),
];

const setup = (props: Partial<React.ComponentProps<typeof ColumnRefreshDialog>> = {}) => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <ColumnRefreshDialog
      open
      onOpenChange={onOpenChange}
      students={students}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { ...view, onOpenChange, onConfirm, user };
};

const goToFields = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Column Refresh' }));

describe('ColumnRefreshDialog', () => {
  it('처음에는 선택된 학생을 확인하는 단계를 보여준다', () => {
    setup();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('선택된 학생')).toBeInTheDocument();
    expect(within(dialog).getByText('김철수')).toBeInTheDocument();
    expect(within(dialog).getByText('이영희')).toBeInTheDocument();
    // 확인 화면이라 학생을 뺄 수 없다.
    expect(within(dialog).queryByRole('button', { name: /제외/ })).not.toBeInTheDocument();
  });

  it('첫 단계에서 이전으로를 누르면 닫는다', async () => {
    const { onOpenChange, user } = setup();

    await user.click(screen.getByRole('button', { name: '이전으로' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('컬럼 선택 단계에서는 컬럼을 하나 이상 골라야 다음으로 갈 수 있다', async () => {
    const { user } = setup();
    await goToFields(user);

    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /기숙사 호실/ }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('고른 컬럼을 고른 순서가 아니라 화면 순서로 설명에 보여준다', async () => {
    const { user } = setup();
    await goToFields(user);

    await user.click(screen.getByRole('checkbox', { name: /자율 동아리/ }));
    await user.click(screen.getByRole('checkbox', { name: /학번/ }));

    expect(screen.getByText('학번, 자율 동아리')).toBeInTheDocument();
  });

  it('컬럼 선택 단계에서 이전으로를 누르면 학생 확인 단계로 돌아간다', async () => {
    const { onOpenChange, user } = setup();
    await goToFields(user);

    await user.click(screen.getByRole('button', { name: '이전으로' }));

    expect(screen.getByText('선택된 학생')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('한 번 더 확인받은 뒤에만 고른 컬럼으로 onConfirm을 부른다', async () => {
    const { onConfirm, user } = setup();
    await goToFields(user);
    await user.click(screen.getByRole('checkbox', { name: /학번/ }));
    await user.click(screen.getByRole('checkbox', { name: /전공 동아리/ }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    const alert = await screen.findByRole('alertdialog');
    expect(alert).toHaveTextContent('선택된 학생들의 컬럼 초기화를 진행할까요?');
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(within(alert).getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledWith(['STUDENT_NUMBER', 'MAJOR_CLUB']);
  });

  it('확인 창에서 취소하면 onConfirm을 부르지 않는다', async () => {
    const { onConfirm, user } = setup();
    await goToFields(user);
    await user.click(screen.getByRole('checkbox', { name: /학번/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: '취소' }),
    );

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('요청 중에는 컬럼을 골라도 다음으로 갈 수 없다', async () => {
    const { user } = setup({ isPending: true });
    await goToFields(user);

    await user.click(screen.getByRole('checkbox', { name: /학번/ }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('닫았다가 다시 열면 첫 단계와 빈 선택으로 시작한다', async () => {
    const { rerender, onOpenChange, onConfirm, user } = setup();
    await goToFields(user);
    await user.click(screen.getByRole('checkbox', { name: /학번/ }));

    const props = { onOpenChange, onConfirm, students };
    rerender(<ColumnRefreshDialog open={false} {...props} />);
    rerender(<ColumnRefreshDialog open {...props} />);

    expect(screen.getByText('선택된 학생')).toBeInTheDocument();
    await goToFields(user);
    expect(screen.getByRole('checkbox', { name: /학번/ })).not.toBeChecked();
  });
});
