'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce, useURLFilters } from '@repo/shared/hooks';
import { Project } from '@repo/shared/types';
import { CommonPagination, PageTitleBar, PageWindow } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  AddProjectSchema,
  AddProjectType,
  ProjectFilterSchema,
  ProjectFilterType,
} from '@/entities/project';
import { useGetClubs } from '@/views/clubs';
import { useGetStudents } from '@/views/students';
import { ProjectFilter, ProjectFormDialog, ProjectList } from '@/widgets/projects';

import { useDeleteProject, useGetProjects } from '../../model';

const PAGE_SIZE = 10;

const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { updateURL } = useURLFilters<ProjectFilterType>();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { mutate: deleteProject } = useDeleteProject({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('프로젝트가 삭제되었습니다.');
    },
    onError: (error) => {
      console.error('프로젝트 삭제 실패:', error);
      toast.error('프로젝트 삭제에 실패했습니다.');
    },
  });

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const initialValues = useMemo(
    (): ProjectFilterType & { page: number } => ({
      projectName: searchParams.get('projectName') || '',
      clubId: searchParams.get('clubId') ? Number(searchParams.get('clubId')) : undefined,
      status: searchParams.get('status') === 'ENDED' ? 'ENDED' : 'ACTIVE',
      page: Number(searchParams.get('page')) || 0,
    }),
    [searchParams],
  );

  const filterForm = useForm<ProjectFilterType>({
    resolver: zodResolver(ProjectFilterSchema),
    defaultValues: {
      projectName: initialValues.projectName,
      clubId: initialValues.clubId,
      status: initialValues.status,
    },
  });

  const {
    control,
    reset,
    formState: { isDirty },
  } = filterForm;

  const filters = useWatch({
    control,
  });

  const debouncedProjectName = useDebounce(filters.projectName);

  const currentPage = initialValues.page;

  useEffect(() => {
    reset({
      projectName: initialValues.projectName,
      clubId: initialValues.clubId,
      status: initialValues.status,
    });
  }, [initialValues, reset]);

  useEffect(() => {
    if (!isDirty) return;

    const hasChanged =
      debouncedProjectName !== initialValues.projectName ||
      filters.clubId !== initialValues.clubId ||
      filters.status !== initialValues.status;

    if (hasChanged) {
      updateURL(
        {
          projectName: debouncedProjectName,
          clubId: filters.clubId,
          status: filters.status,
        },
        0,
      );
    }
  }, [debouncedProjectName, filters.clubId, filters.status, initialValues, updateURL, isDirty]);

  const handlePageChange = (page: number) => {
    updateURL(
      {
        projectName: debouncedProjectName,
        clubId: filters.clubId,
        status: filters.status,
      },
      page,
    );
  };

  const queryParams = {
    page: currentPage,
    size: PAGE_SIZE,
    projectName: debouncedProjectName || undefined,
    clubId: filters.clubId,
    status: filters.status,
  };

  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects(queryParams);
  const { data: clubsData } = useGetClubs({ size: 100, clubType: 'MAJOR_CLUB' });
  const { data: studentsData, isLoading: isLoadingStudents } = useGetStudents(
    {},
    {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 30,
    },
  );

  const projectList = projectsData?.data.projects || [];
  const totalPages = projectsData?.data.totalPages || 0;
  const clubs = clubsData?.data.clubs || [];

  const projectForm = useForm<AddProjectType>({
    resolver: zodResolver(AddProjectSchema),
    defaultValues: {
      status: 'ACTIVE',
      participantIds: [],
      clubId: 0,
      repositories: [],
      techStacks: [],
    },
  });

  const isEmpty = !isLoadingProjects && !projectList.length;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageTitleBar
          title="PROJECT MANAGEMENT"
          description="동아리에서 운영하는 프로젝트를 관리합니다."
        />

        <PageWindow
          windowTitle="Project Management"
          title="프로젝트 관리"
          description="프로젝트들의 정보를 확인하거나 수정하세요."
          action={
            <ProjectFormDialog
              mode="create"
              form={projectForm}
              clubs={clubs}
              students={studentsData?.data.students}
              isLoadingStudents={isLoadingStudents}
            />
          }
        >
          {/* Filters */}
          <div className={cn('mb-2')}>
            <ProjectFilter control={control} clubs={clubs} />
          </div>

          {/* Table */}
          <div className={cn(!isEmpty && 'border-foreground border')}>
            <ProjectList
              projects={projectList}
              isLoading={isLoadingProjects}
              onEdit={handleEditProject}
              onDelete={(projectId) => deleteProject(projectId)}
            />
          </div>

          <div className={cn('mt-5')}>
            <CommonPagination
              isLoading={isLoadingProjects}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </PageWindow>

        {editingProject && (
          <ProjectFormDialog
            mode="edit"
            project={editingProject}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            form={projectForm}
            clubs={clubs}
            students={studentsData?.data.students}
            isLoadingStudents={isLoadingStudents}
          />
        )}
      </main>
    </div>
  );
};

export default ProjectsPage;
