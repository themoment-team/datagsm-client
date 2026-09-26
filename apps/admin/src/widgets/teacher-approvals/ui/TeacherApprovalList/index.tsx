import { AccountListItem } from '@repo/shared/types';
import {
  Button,
  ConfirmDialog,
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

import { getTeacherDepartmentLabel } from '@/entities/account';

interface TeacherApprovalListProps {
  accounts?: AccountListItem[];
  isLoading?: boolean;
  isApproving?: boolean;
  onApprove?: (accountId: number) => void;
}

const TeacherApprovalList = ({
  accounts,
  isLoading,
  isApproving,
  onApprove,
}: TeacherApprovalListProps) => {
  if (!isLoading && !accounts?.length) {
    return (
      <p className={cn('text-muted-foreground py-12 text-center font-mono text-xs')}>
        승인 대기 중인 선생님 계정이 없습니다.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className={cn(TABLE_HEAD_ROW_STYLE)}>
          <TableHead className={cn('w-[240px]')}>이메일</TableHead>
          <TableHead className={cn('w-[120px]')}>성함</TableHead>
          <TableHead className={cn('w-[120px]')}>소속부서</TableHead>
          <TableHead>설명</TableHead>
          <TableHead className={cn('w-[160px]')}>신청일</TableHead>
          <TableHead className={cn('w-[170px]')}>
            <span className={cn('sr-only')}>작업</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index} className={cn(TABLE_BODY_ROW_STYLE)}>
                <TableCell>
                  <Skeleton className={cn('h-4 w-40')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-16')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-20')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-32')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-4 w-24')} />
                </TableCell>
                <TableCell>
                  <Skeleton className={cn('h-6 w-32')} />
                </TableCell>
              </TableRow>
            ))
          : accounts?.map((account) => (
              <TableRow key={account.id} className={cn(TABLE_BODY_ROW_STYLE)}>
                <TableCell>{account.email}</TableCell>
                <TableCell>{account.teacher?.name ?? '-'}</TableCell>
                <TableCell>
                  {account.teacher ? getTeacherDepartmentLabel(account.teacher.department) : '-'}
                </TableCell>
                <TableCell>{account.teacher?.description || '-'}</TableCell>
                <TableCell>
                  {new Date(account.createdAt).toLocaleDateString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                  })}
                </TableCell>
                <TableCell>
                  <div className={cn('flex items-center gap-2')}>
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="pixel"
                          className={cn('h-6 border px-2')}
                          disabled={isApproving}
                        >
                          Allow
                        </Button>
                      }
                      title={`“${account.email}”의 요청을 허락할까요?`}
                      description="승인 후에는 되돌릴 수 없습니다."
                      confirmLabel="확인"
                      confirmVariant="pixel-primary"
                      onConfirm={() => onApprove?.(account.id)}
                    />

                    {/* 거절(계정 삭제) API가 서버에 아직 없어 비활성화 처리. API 추가 시 연동 필요 (#223) */}
                    {/* disabled 버튼은 pointer-events-none이 걸려 title 툴팁이 뜨지 않으므로 span에 붙인다 */}
                    <span title="거절 기능은 아직 지원되지 않습니다.">
                      <Button
                        type="button"
                        variant="pixel-destructive"
                        className={cn('h-6 border px-2')}
                        disabled
                      >
                        Delete
                      </Button>
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
};

export default TeacherApprovalList;
