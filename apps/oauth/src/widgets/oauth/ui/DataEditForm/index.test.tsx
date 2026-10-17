import { render, screen, selectOption, userEvent } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { DataEditFieldSpec } from '@/entities/data-edit';

import DataEditForm from '.';

const CLUB_OPTIONS = [
  { value: 3, label: '더모먼트' },
  { value: 7, label: '인포' },
];

const setup = (fields: DataEditFieldSpec[], isPending = false) => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<DataEditForm fields={fields} onSubmit={onSubmit} isPending={isPending} />);
  return { onSubmit, user };
};

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Enter' }));

describe('DataEditForm', () => {
  it('요청된 항목만 보여준다', () => {
    setup([{ name: 'STUDENT_NUMBER' }, { name: 'MAJOR_CLUB', options: CLUB_OPTIONS }]);

    expect(screen.getByLabelText('학번')).toBeInTheDocument();
    expect(screen.getByLabelText('전공 동아리')).toBeInTheDocument();
    expect(screen.queryByLabelText('기숙사 호실')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('자율 동아리')).not.toBeInTheDocument();
  });

  it('입력값이 규칙에 맞지 않으면 항목별 에러를 보여주고 제출하지 않는다', async () => {
    const { onSubmit, user } = setup([
      { name: 'STUDENT_NUMBER' },
      { name: 'DORMITORY_ROOM_NUMBER' },
      { name: 'MAJOR_CLUB', options: CLUB_OPTIONS },
    ]);

    await user.type(screen.getByLabelText('학번'), '4101');
    await user.type(screen.getByLabelText('기숙사 호실'), '999');
    await submit(user);

    expect(await screen.findByText('학년은 1~3만 가능합니다.')).toBeInTheDocument();
    expect(screen.getByText('201호 ~ 518호 사이로 입력하세요.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('동아리를 고르지 않고 제출하면 한국어 안내를 보여준다', async () => {
    const { user } = setup([{ name: 'MAJOR_CLUB', options: CLUB_OPTIONS }]);

    await submit(user);

    expect(await screen.findByText('동아리를 선택하세요.')).toBeInTheDocument();
  });

  it('입력 길이를 학번 4자, 호실 3자로 제한한다', async () => {
    const { user } = setup([{ name: 'STUDENT_NUMBER' }, { name: 'DORMITORY_ROOM_NUMBER' }]);

    await user.type(screen.getByLabelText('학번'), '210345');
    await user.type(screen.getByLabelText('기숙사 호실'), '30512');

    expect(screen.getByLabelText('학번')).toHaveValue('2103');
    expect(screen.getByLabelText('기숙사 호실')).toHaveValue('305');
  });

  it('동아리 선택지는 무소속을 맨 앞에 두고 서버가 준 동아리를 이어서 보여준다', async () => {
    const { user } = setup([{ name: 'AUTONOMOUS_CLUB', options: CLUB_OPTIONS }]);

    screen.getByLabelText('자율 동아리').focus();
    await user.keyboard('{ArrowDown}');

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['무소속', '더모먼트', '인포']);
  });

  it('값을 전송 형태로 바꿔 제출한다', async () => {
    const { onSubmit, user } = setup([
      { name: 'STUDENT_NUMBER' },
      { name: 'DORMITORY_ROOM_NUMBER' },
      { name: 'MAJOR_CLUB', options: CLUB_OPTIONS },
      { name: 'AUTONOMOUS_CLUB', options: CLUB_OPTIONS },
    ]);

    await user.type(screen.getByLabelText('학번'), '2103');
    await user.type(screen.getByLabelText('기숙사 호실'), '305');
    await selectOption(user, screen.getByLabelText('전공 동아리'), '더모먼트');
    await selectOption(user, screen.getByLabelText('자율 동아리'), '무소속');
    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith({
      studentGrade: 2,
      studentClass: 1,
      studentNumber: 3,
      dormitoryRoomNumber: 305,
      majorClubId: 3,
      autonomousClubId: 0,
    });
  });

  it('처리 중에는 입력과 제출을 막는다', () => {
    setup([{ name: 'STUDENT_NUMBER' }, { name: 'MAJOR_CLUB', options: CLUB_OPTIONS }], true);

    expect(screen.getByLabelText('학번')).toBeDisabled();
    expect(screen.getByLabelText('전공 동아리')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enter' })).toBeDisabled();
  });
});
