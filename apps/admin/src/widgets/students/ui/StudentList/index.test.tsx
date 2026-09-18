import { createClub, createStudent, render, screen, userEvent, within } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import StudentList from '.';

const rowOf = (name: string) => screen.getByRole('cell', { name }).closest('tr')!;

describe('StudentList', () => {
  it('학생이 없으면 빈 상태 문구를 보여준다', () => {
    render(<StudentList students={[]} />);

    expect(screen.getByText('조건에 맞는 학생이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('불러오는 중에는 빈 상태 대신 표 뼈대를 보여준다', () => {
    render(<StudentList isLoading />);

    expect(screen.queryByText('조건에 맞는 학생이 없습니다.')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(11);
  });

  it('학생 정보를 라벨로 바꿔 보여주고, 없는 값은 없음으로 보여준다', () => {
    const student = createStudent({
      name: '홍길동',
      sex: 'WOMAN',
      grade: 2,
      classNum: 1,
      number: 3,
      major: 'SMART_IOT',
      role: 'STUDENT_COUNCIL',
      dormitoryRoom: 305,
      majorClub: createClub({ name: '더모먼트' }),
      autonomousClub: null,
    });
    render(<StudentList students={[student]} />);

    const cells = within(rowOf('홍길동'))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells.slice(0, 9)).toEqual([
      '홍길동',
      '여',
      '2103',
      student.email,
      '스마트IoT과',
      '학생회',
      '305호',
      '더모먼트',
      '없음',
    ]);
  });

  it('기숙사 호실이 없으면 없음으로 보여준다', () => {
    render(<StudentList students={[createStudent({ name: '통학생', dormitoryRoom: 0 })]} />);

    const dormitoryCell = within(rowOf('통학생')).getAllByRole('cell')[6];
    expect(dormitoryCell).toHaveTextContent(/^없음$/);
  });

  describe('기본 모드', () => {
    it('행마다 Edit 버튼을 두고 누르면 그 학생으로 onEdit을 부른다', async () => {
      const onEdit = vi.fn();
      const students = [createStudent({ name: '김철수' }), createStudent({ name: '이영희' })];
      const user = userEvent.setup();
      render(<StudentList students={students} onEdit={onEdit} />);

      await user.click(within(rowOf('이영희')).getByRole('button', { name: 'Edit' }));

      expect(onEdit).toHaveBeenCalledWith(students[1]);
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('컬럼 초기화 모드', () => {
    const students = [createStudent({ name: '김철수' }), createStudent({ name: '이영희' })];

    it('Edit 버튼 대신 학생별 선택 체크박스와 전체선택을 보여준다', () => {
      render(<StudentList students={students} selectable />);

      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '김철수 선택' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '전체선택' })).toBeInTheDocument();
    });

    it('선택된 학생을 체크하고 행을 선택 상태로 표시한다', () => {
      render(<StudentList students={students} selectable selectedIds={[students[0]!.id]} />);

      expect(screen.getByRole('checkbox', { name: '김철수 선택' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: '이영희 선택' })).not.toBeChecked();
      expect(rowOf('김철수')).toHaveAttribute('data-state', 'selected');
      expect(rowOf('이영희')).not.toHaveAttribute('data-state');
    });

    it('체크박스를 누르면 그 학생으로 onToggleSelect를 부른다', async () => {
      const onToggleSelect = vi.fn();
      const user = userEvent.setup();
      render(<StudentList students={students} selectable onToggleSelect={onToggleSelect} />);

      await user.click(screen.getByRole('checkbox', { name: '이영희 선택' }));

      expect(onToggleSelect).toHaveBeenCalledWith(students[1]);
    });

    it('전체선택은 넘겨받은 상태를 보여주고, 누르거나 라벨을 눌러도 onToggleSelectAll을 부른다', async () => {
      const onToggleSelectAll = vi.fn();
      const user = userEvent.setup();
      render(
        <StudentList
          students={students}
          selectable
          isAllSelected
          onToggleSelectAll={onToggleSelectAll}
        />,
      );

      expect(screen.getByRole('checkbox', { name: '전체선택' })).toBeChecked();

      await user.click(screen.getByRole('checkbox', { name: '전체선택' }));
      await user.click(screen.getByText('전체선택'));

      expect(onToggleSelectAll).toHaveBeenCalledTimes(2);
    });

    it('전체선택을 막아 두면 누를 수 없다', async () => {
      const onToggleSelectAll = vi.fn();
      const user = userEvent.setup();
      render(
        <StudentList
          students={students}
          selectable
          isSelectAllDisabled
          onToggleSelectAll={onToggleSelectAll}
        />,
      );

      const selectAll = screen.getByRole('checkbox', { name: '전체선택' });
      expect(selectAll).toBeDisabled();

      await user.click(selectAll);
      expect(onToggleSelectAll).not.toHaveBeenCalled();
    });
  });
});
