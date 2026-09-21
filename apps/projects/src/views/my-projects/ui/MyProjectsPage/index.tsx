'use client';

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { Plus } from 'lucide-react';

import { useURLFilters } from '@repo/shared/hooks';
import type { MyProject, ProjectRequestStatus } from '@repo/shared/types';
import { Button, PageHeader, Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_REQUEST_STATUS_FILTER_OPTIONS } from '@/entities/project';
import { getIsAuthenticated, startLogin } from '@/shared/lib';
import { useGetMyProjects } from '../../model/useGetMyProjects';
import { MyProjectCard } from '@/widgets/my-project';
import { ProjectFormDialog } from '@/widgets/project-form';

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

const MyProjectsPage = () => {
  const searchParams = useSearchParams();
  const { updateURL } = useURLFilters<{ status: string }>();

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (getIsAuthenticated()) {
      setAuthorized(true);
    } else {
      startLogin('/me');
    }
  }, []);

  const status = searchParams.get('status') ?? 'all';
  const requestStatus = status === 'all' ? undefined : (status as ProjectRequestStatus);

  const { data, isLoading } = useGetMyProjects(requestStatus, { enabled: authorized });
  const projects = data?.data.projects ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MyProject | null>(null);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (project: MyProject) => {
    setEditing(project);
    setFormOpen(true);
  };

  if (!authorized) return null;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageHeader
          breadcrumb="DATAGSM / PROJECTS"
          title="내 프로젝트"
          action={
            <Button onClick={handleCreate} className={cn('gap-1.5')}>
              <Plus className={cn('h-4 w-4')} />
              프로젝트 신청
            </Button>
          }
        />

        <div className={cn('mb-6 flex flex-wrap gap-2')}>
          {PROJECT_REQUEST_STATUS_FILTER_OPTIONS.map((option) => (
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
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className={cn('border-foreground h-40 border-2')} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div
            className={cn(
              'border-foreground text-muted-foreground flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
            )}
          >
            신청하거나 참여 중인 프로젝트가 없습니다.
          </div>
        ) : (
          <div className={cn(GRID_CLASS)}>
            {projects.map((project) => (
              <MyProjectCard
                key={project.requestId ?? project.projectId}
                project={project}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </main>

      <ProjectFormDialog
        mode={editing ? 'edit' : 'create'}
        initial={editing ?? undefined}
        projectId={editing?.projectId ?? undefined}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
};

export default MyProjectsPage;
