'use client';

import { useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useURLFilters } from '@repo/shared/hooks';
import { CommonPagination, PageTitleBar, PageWindow } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useGetAccounts } from '@/views/accounts';
import {
  TeacherApprovalList,
  useApproveTeacherAccount,
  useRejectTeacherAccount,
} from '@/widgets/teacher-approvals';

const PAGE_SIZE = 10;

const TeacherApprovalsPage = () => {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { updateURL } = useURLFilters<Record<string, never>>();

  const currentPage = useMemo(() => Number(searchParams.get('page')) || 0, [searchParams]);

  const {
    data: accountsData,
    isLoading,
    isFetching,
  } = useGetAccounts({
    page: currentPage,
    size: PAGE_SIZE,
    objectType: 'TEACHER',
    status: 'PENDING',
  });

  const { mutate: approveTeacher, isPending: isApproving } = useApproveTeacherAccount({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('선생님 계정을 승인했습니다.');
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        toast.info('이미 승인된 계정입니다.');
        return;
      }
      console.error('선생님 계정 승인 실패:', error);
      toast.error('선생님 계정 승인에 실패했습니다.');
    },
  });

  const { mutate: rejectTeacher, isPending: isRejecting } = useRejectTeacherAccount({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('선생님 계정 요청을 거절했습니다.');
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        toast.info('이미 승인된 계정입니다.');
        return;
      }
      console.error('선생님 계정 거절 실패:', error);
      toast.error('선생님 계정 거절에 실패했습니다.');
    },
  });

  const accounts = accountsData?.data.accounts;
  const totalPages = accountsData?.data.totalPages ?? 0;
  const isEmpty = !isLoading && !accounts?.length;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageTitleBar title="TEACHER APPROVE" description="DataGSM의 선생님 역할을 승인합니다." />

        <PageWindow
          windowTitle="Teacher Approve"
          title="선생님 역할 승인"
          description="선생님 역할이 요청된 계정들을 관리하세요"
        >
          {/* Table */}
          <div className={cn(!isEmpty && 'border-foreground border')}>
            <TeacherApprovalList
              accounts={accounts}
              isLoading={isLoading}
              isApproving={isApproving || isFetching}
              isRejecting={isRejecting || isFetching}
              onApprove={(accountId) => approveTeacher({ accountId })}
              onReject={(accountId) => rejectTeacher({ accountId })}
            />
          </div>

          <div className={cn('mt-5')}>
            <CommonPagination
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => updateURL({}, page)}
            />
          </div>
        </PageWindow>
      </main>
    </div>
  );
};

export default TeacherApprovalsPage;
