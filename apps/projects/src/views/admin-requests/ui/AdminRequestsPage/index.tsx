'use client';

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { useURLFilters } from '@repo/shared/hooks';
import type { ProjectEditRequest, ProjectRequestStatus } from '@repo/shared/types';
import { CommonPagination, PageHeader, Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_REQUEST_STATUS_FILTER_OPTIONS } from '@/entities/project';
import { useGetMe } from '@/shared/hooks';
import { getIsAuthenticated, startLogin } from '@/shared/lib';
import { RequestCard, RequestReviewDialog } from '@/widgets/request-review';
import { useGetProjectRequests } from '../../model/useGetProjectRequests';

const PAGE_SIZE = 20;
const DEFAULT_STATUS: ProjectRequestStatus = 'PENDING';

// 어드민 심사 탭은 상태별로만 본다 ('전체' 제외).
const STATUS_TABS = PROJECT_REQUEST_STATUS_FILTER_OPTIONS.filter((option) => option.value !== 'all');

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

const AdminRequestsPage = () => {
  const searchParams = useSearchParams();
  const { updateURL } = useURLFilters<{ status: string }>();

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (getIsAuthenticated()) {
      setAuthorized(true);
    } else {
      startLogin('/requests');
    }
  }, []);

  const { data: meData, isLoading: isMeLoading } = useGetMe({ enabled: authorized });
  const role = meData?.data.role;
  const isAdmin = role === 'ADMIN' || role === 'ROOT';

  const status = (searchParams.get('status') as ProjectRequestStatus | null) ?? DEFAULT_STATUS;
  const page = Number(searchParams.get('page')) || 0;

  const { data, isLoading } = useGetProjectRequests(
    { requestStatus: status, page, size: PAGE_SIZE },
    { enabled: authorized && isAdmin },
  );

  const requests = data?.data.requests ?? [];
  const totalPages = data?.data.totalPages ?? 0;

  const [selected, setSelected] = useState<ProjectEditRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (request: ProjectEditRequest) => {
    setSelected(request);
    setDialogOpen(true);
  };

  if (!authorized) return null;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageHeader breadcrumb="DATAGSM / PROJECTS" title="프로젝트 심사" />

        {isMeLoading ? (
          <Skeleton className={cn('border-foreground h-40 border-2')} />
        ) : !isAdmin ? (
          <div
            className={cn(
              'border-foreground text-muted-foreground flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
            )}
          >
            어드민만 접근할 수 있는 페이지입니다.
          </div>
        ) : (
          <>
            <div className={cn('mb-6 flex flex-wrap gap-2')}>
              {STATUS_TABS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateURL({ status: option.value })}
                  className={cn(
                    'border-foreground border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
                    status === option.value
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className={cn(GRID_CLASS)}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className={cn('border-foreground h-32 border-2')} />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div
                className={cn(
                  'border-foreground text-muted-foreground flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
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

            <div className={cn('mt-6')}>
              <CommonPagination
                isLoading={isLoading}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => updateURL({}, nextPage)}
              />
            </div>
          </>
        )}
      </main>

      <RequestReviewDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default AdminRequestsPage;
