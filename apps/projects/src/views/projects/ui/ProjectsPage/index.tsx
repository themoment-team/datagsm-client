'use client';

import { useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useURLFilters } from '@repo/shared/hooks';
import type { ProjectStatus } from '@repo/shared/types';
import { Button, CommonPagination, type FilterOption, PageHeader } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { FolderOpen, Plus } from 'lucide-react';

import { DEFAULT_PROJECT_SORT, parseProjectSort } from '@/entities/project';
import { useGetMajorClubs } from '@/shared/hooks';
import { requireAuth } from '@/shared/lib';
import { useGetPublicProjects } from '@/views/projects/model/useGetPublicProjects';
import { ProjectList, ProjectListFilter } from '@/widgets/project';
import { ProjectFormDialog } from '@/widgets/project-form';

const PAGE_SIZE = 12;
const ALL = 'all';

const ProjectsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateURL } = useURLFilters<{
    projectName: string;
    status: string;
    sort: string;
    clubId: string;
  }>();

  const [isFormOpen, setFormOpen] = useState(false);

  const filters = useMemo(() => {
    return {
      projectName: searchParams.get('projectName') ?? '',
      status: searchParams.get('status') ?? ALL,
      sort: searchParams.get('sort') ?? DEFAULT_PROJECT_SORT,
      clubId: searchParams.get('clubId') ?? ALL,
      page: Number(searchParams.get('page')) || 0,
    };
  }, [searchParams]);

  const { sortBy, sortDirection } = parseProjectSort(filters.sort);

  // 공개 페이지라 비로그인 상태에서도 호출된다. 401이 나도 토큰 갱신·리다이렉트는 타지 않는다.
  const { data: clubsData } = useGetMajorClubs({ skipAuthRefresh: true });

  const clubOptions = useMemo<FilterOption[]>(
    () => [
      { value: ALL, label: '전체' },
      ...(clubsData?.data.clubs ?? []).map((club) => ({
        value: String(club.id),
        label: club.name,
      })),
    ],
    [clubsData],
  );

  const { data, isLoading, isError } = useGetPublicProjects({
    projectName: filters.projectName || undefined,
    status: filters.status === ALL ? undefined : (filters.status as ProjectStatus),
    clubId: filters.clubId === ALL ? undefined : Number(filters.clubId),
    sortBy,
    sortDirection,
    page: filters.page,
    size: PAGE_SIZE,
  });

  const projects = data?.data.projects ?? [];
  const totalPages = data?.data.totalPages ?? 0;

  const handleSearch = (value: string) => updateURL({ projectName: value }, 0);
  const handleStatus = (value: string) => updateURL({ status: value }, 0);
  const handleSort = (value: string) => updateURL({ sort: value }, 0);
  const handleClub = (value: string) => updateURL({ clubId: value }, 0);
  const handlePage = (page: number) => updateURL({}, page);

  const handleApply = () => requireAuth(() => setFormOpen(true), '/');
  // 내 프로젝트는 로그인 전용 화면이라 비로그인 상태면 바로 로그인으로 보낸다.
  const handleMyProjects = () => requireAuth(() => router.push('/me'), '/me');

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageHeader
          breadcrumb="DATAGSM / PROJECTS"
          title="프로젝트"
          action={
            <div className={cn('flex items-center gap-2')}>
              <Button variant="outline" onClick={handleMyProjects} className={cn('gap-1.5')}>
                <FolderOpen className={cn('h-4 w-4')} />
                내 프로젝트
              </Button>
              <Button onClick={handleApply} className={cn('gap-1.5')}>
                <Plus className={cn('h-4 w-4')} />
                프로젝트 신청
              </Button>
            </div>
          }
        />

        <div className={cn('mb-6')}>
          <ProjectListFilter
            defaultSearch={filters.projectName}
            status={filters.status}
            sort={filters.sort}
            clubId={filters.clubId}
            clubOptions={clubOptions}
            onSearchSubmit={handleSearch}
            onStatusChange={handleStatus}
            onSortChange={handleSort}
            onClubChange={handleClub}
          />
        </div>

        {isError ? (
          <div
            className={cn(
              'border-foreground text-muted-foreground flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
            )}
          >
            프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        ) : (
          <ProjectList projects={projects} isLoading={isLoading} />
        )}

        <div className={cn('mt-6')}>
          <CommonPagination
            isLoading={isLoading}
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePage}
          />
        </div>
      </main>

      <ProjectFormDialog mode="create" open={isFormOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default ProjectsPage;
