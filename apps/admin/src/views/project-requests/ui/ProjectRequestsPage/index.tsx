'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { useURLFilters } from '@repo/shared/hooks';
import type { BaseApiResponse, ProjectEditRequest, ProjectRequestStatus } from '@repo/shared/types';
import { CommonPagination, PageTitleBar, PageWindow, Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_REQUEST_STATUS_TABS } from '@/entities/project';
import { RequestCard, RequestReviewDialog } from '@/widgets/project-requests';

import { useGetProjectRequests } from '../../model';

const PAGE_SIZE = 20;
const DEFAULT_STATUS: ProjectRequestStatus = 'PENDING';

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

const ProjectRequestsPage = () => {
  const searchParams = useSearchParams();
  const { updateURL } = useURLFilters<{ status: string }>();

  const status = (searchParams.get('status') as ProjectRequestStatus | null) ?? DEFAULT_STATUS;
  const page = Number(searchParams.get('page')) || 0;

  const { data, isLoading, isError, error } = useGetProjectRequests({
    requestStatus: status,
    page,
    size: PAGE_SIZE,
  });

  // 다시 불러오다 실패해도 이전 응답은 남는다. 처리 전 목록일 수 있어 쓰지 않고 오류를 보여 준다.
  const listData = isError ? undefined : data?.data;
  const requests = listData?.requests ?? [];
  const totalPages = listData?.totalPages ?? 0;
  // 서버가 실패 이유를 내려 주면 그 문구를 그대로 보여 준다.
  const errorMessage =
    (error as { response?: { data?: BaseApiResponse } } | null)?.response?.data?.message ||
    '신청 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

  const [selected, setSelected] = useState<ProjectEditRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (request: ProjectEditRequest) => {
    setSelected(request);
    setDialogOpen(true);
  };

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageTitleBar
          title="PROJECT REQUESTS"
          description="학생이 신청한 프로젝트 등록·수정 요청을 심사합니다."
        />

        <PageWindow
          windowTitle="Project Requests"
          title="프로젝트 심사"
          description="신청 내용을 확인하고 수락하거나 거절하세요."
        >
          <div className={cn('mb-4 flex flex-wrap gap-2')}>
            {PROJECT_REQUEST_STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateURL({ status: tab.value }, 0)}
                className={cn(
                  'border-foreground border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
                  status === tab.value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className={cn(GRID_CLASS)}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className={cn('border-foreground h-32 border')} />
              ))}
            </div>
          ) : isError ? (
            <div
              className={cn(
                'border-foreground text-muted-foreground flex h-40 items-center justify-center border border-dashed font-mono text-sm',
              )}
            >
              {errorMessage}
            </div>
          ) : requests.length === 0 ? (
            <div
              className={cn(
                'border-foreground text-muted-foreground flex h-40 items-center justify-center border border-dashed font-mono text-sm',
              )}
            >
              해당 상태의 신청이 없습니다.
            </div>
          ) : (
            <div className={cn(GRID_CLASS)}>
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} onSelect={handleSelect} />
              ))}
            </div>
          )}

          <div className={cn('mt-5')}>
            <CommonPagination
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => updateURL({ status }, nextPage)}
            />
          </div>
        </PageWindow>
      </main>

      <RequestReviewDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default ProjectRequestsPage;
