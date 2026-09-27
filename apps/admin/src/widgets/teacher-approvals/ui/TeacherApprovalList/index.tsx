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
  isRejecting?: boolean;
  onApprove?: (accountId: number) => void;
  onReject?: (accountId: number) => void;
}

const TeacherApprovalList = ({
  accounts,
  isLoading,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
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

                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="pixel-destructive"
                          className={cn('h-6 border px-2')}
                          disabled={isRejecting}
                        >
                          Delete
                        </Button>
                      }
                      title={`“${account.email}”의 요청을 거절할까요?`}
                      warning="> 중요: 거절하면 해당 계정은 삭제되며 되돌릴 수 없습니다!"
                      description="거절하면 해당 계정은 삭제되며 되돌릴 수 없습니다."
                      confirmLabel="확인"
                      confirmVariant="pixel-destructive"
                      onConfirm={() => onReject?.(account.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
};

export default TeacherApprovalList;
