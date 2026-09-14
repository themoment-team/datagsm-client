import { Student } from '@repo/shared/types';
import {
  Button,
  Checkbox,
  Skeleton,
  TABLE_BODY_ROW_STYLE,
  TABLE_HEAD_ROW_STYLE,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { getMajorLabel, getRoleBadgeStyle, getRoleLabel, getSexLabel } from '@/entities/student';

interface StudentListProps {
  students?: Student[];
  isLoading?: boolean;
  onEdit?: (student: Student) => void;
  /** 컬럼 초기화 모드. 켜면 마지막 열의 Edit 버튼이 선택 체크박스로 바뀐다. */
  selectable?: boolean;
  /** 선택된 학생 ID. 페이지를 넘겨도 유지되도록 부모가 들고 있는다. */
  selectedIds?: number[];
  onToggleSelect?: (student: Student) => void;
  /** 현재 필터에 걸리는 학생이 모두 선택되었는지. 페이지가 아니라 필터 전체 기준이다. */
  isAllSelected?: boolean;
  isSelectAllDisabled?: boolean;
  onToggleSelectAll?: () => void;
}

const StudentList = ({
  students,
  isLoading,
  onEdit,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  isAllSelected = false,
  isSelectAllDisabled = false,
  onToggleSelectAll,
}: StudentListProps) => {
  if (!isLoading && !students?.length) {
    return (
      <p className={cn('text-muted-foreground py-12 text-center font-mono text-xs')}>
        조건에 맞는 학생이 없습니다.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className={cn(TABLE_HEAD_ROW_STYLE)}>
          <TableHead className={cn('w-[100px]')}>이름</TableHead>
          <TableHead className={cn('w-[100px]')}>성별</TableHead>
          <TableHead className={cn('w-[100px]')}>학번</TableHead>
          <TableHead className={cn('w-[180px]')}>이메일</TableHead>
          <TableHead className={cn('w-[140px]')}>학과</TableHead>
          <TableHead className={cn('w-[140px]')}>구분</TableHead>
          <TableHead className={cn('w-[140px]')}>기숙사 호실</TableHead>
          <TableHead>전공동아리</TableHead>
          <TableHead>자율동아리</TableHead>
          <TableHead className={cn('w-[70px]')}>
            {selectable ? (
              <label
                htmlFor="student-select-all"
                className={cn('flex cursor-pointer items-center justify-end gap-3')}
              >
                전체선택
                {/* 헤더가 반전 배경이라 체크된 상태에서도 테두리가 보이도록 뒤집는다. */}
                <Checkbox
                  id="student-select-all"
                  checked={isAllSelected}
                  disabled={isSelectAllDisabled}
                  onCheckedChange={() => onToggleSelectAll?.()}
                  className={cn('border-background size-5')}
                />
              </label>
            ) : (
              <span className={cn('sr-only')}>작업</span>
            )}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index} className={cn(TABLE_BODY_ROW_STYLE)}>
                <TableCell>
                  <Skeleton className={cn('h-4 w-16')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-8')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-16')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-32')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-24')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-6 w-16')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-12')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-20')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-20')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-6 w-12')} />
                </TableCell>
              </TableRow>
            ))
          : students?.map((student) => {
              const isSelected = selectable && selectedIds.includes(student.id);

              return (
                <TableRow
                  key={student.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={cn(
                    TABLE_BODY_ROW_STYLE,
                    // 선택된 행은 명암을 뒤집어 한눈에 구분되게 한다.
                    isSelected && 'bg-foreground hover:bg-foreground [&>td]:text-background',
                  )}
                >
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{getSexLabel(student.sex)}</TableCell>
                  <TableCell>{student.studentNumber}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{getMajorLabel(student.major)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex h-6 items-center border px-2 font-mono text-[11px] font-medium tracking-[0.1em]',
                        // 뒤집힌 행에서는 배지도 같이 뒤집어야 읽힌다.
                        isSelected
                          ? 'border-background text-background'
                          : getRoleBadgeStyle(student.role),
                      )}
                    >
                      {getRoleLabel(student.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {student.dormitoryRoom ? `${student.dormitoryRoom}호` : '없음'}
                  </TableCell>
                  <TableCell>{student.majorClub?.name ?? '없음'}</TableCell>
                  <TableCell>{student.autonomousClub?.name ?? '없음'}</TableCell>
                  <TableCell>
                    {selectable ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect?.(student)}
                        aria-label={`${student.name} 선택`}
                        className={cn('size-5', isSelected && 'border-background')}
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="pixel"
                        className={cn('h-6 border px-2')}
                        onClick={() => onEdit?.(student)}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
      </TableBody>
    </Table>
  );
};

export default StudentList;
