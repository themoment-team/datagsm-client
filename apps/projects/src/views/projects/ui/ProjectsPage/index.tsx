'use client';

import { useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { Plus } from 'lucide-react';

import { useURLFilters } from '@repo/shared/hooks';
import type { ProjectStatus } from '@repo/shared/types';
import { Button, CommonPagination, PageHeader } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { DEFAULT_PROJECT_SORT, parseProjectSort } from '@/entities/project';
import { requireAuth } from '@/shared/lib';
import { useGetPublicProjects } from '@/views/projects/model/useGetPublicProjects';
import { ProjectList, ProjectListFilter } from '@/widgets/project';
import { ProjectFormDialog } from '@/widgets/project-form';

const PAGE_SIZE = 12;

const ProjectsPage = () => {
  const searchParams = useSearchParams();
  const { updateURL } = useURLFilters<{ projectName: string; status: string; sort: string }>();

  const [isFormOpen, setFormOpen] = useState(false);

  const filters = useMemo(() => {
    return {
      projectName: searchParams.get('projectName') ?? '',
      status: searchParams.get('status') ?? 'all',
      sort: searchParams.get('sort') ?? DEFAULT_PROJECT_SORT,
      page: Number(searchParams.get('page')) || 0,
    };
  }, [searchParams]);

  const { sortBy, sortDirection } = parseProjectSort(filters.sort);

  const { data, isLoading, isError } = useGetPublicProjects({
    projectName: filters.projectName || undefined,
    status: filters.status === 'all' ? undefined : (filters.status as ProjectStatus),
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
  const handlePage = (page: number) => updateURL({}, page);

  const handleApply = () => requireAuth(() => setFormOpen(true), '/');

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageHeader
          breadcrumb="DATAGSM / PROJECTS"
          title="프로젝트"
          action={
            <Button onClick={handleApply} className={cn('gap-1.5')}>
              <Plus className={cn('h-4 w-4')} />
              프로젝트 신청
            </Button>
          }
        />

        <div className={cn('mb-6')}>
          <ProjectListFilter
            defaultSearch={filters.projectName}
            status={filters.status}
            sort={filters.sort}
            onSearchSubmit={handleSearch}
            onStatusChange={handleStatus}
            onSortChange={handleSort}
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
