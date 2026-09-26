'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type { BaseApiResponse, MyProject, ProjectRequestBody } from '@repo/shared/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormErrorMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
  Textarea,
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  NO_CLUB_ID,
  PROJECT_DEPLOYMENT_URL_MAX_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_REPOSITORY_MAX_COUNT,
  PROJECT_REPOSITORY_MAX_LENGTH,
  PROJECT_TECH_STACK_MAX_COUNT,
  PROJECT_TECH_STACK_MAX_LENGTH,
  type ProjectFormType,
  projectFormSchema,
} from '@/entities/project';
import { useGetMajorClubs } from '@/shared/hooks';

import { useCreateProject } from '../../model/useCreateProject';
import { useUpdateProject } from '../../model/useUpdateProject';
import ProjectIconField from '../ProjectIconField';

interface ProjectFormDialogProps {
  mode: 'create' | 'edit';
  initial?: MyProject;
  /** 값이 있으면 수정(PUT), 없으면 신규·재신청(POST) */
  projectId?: number | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const LABEL_STYLE = 'text-muted-foreground font-mono text-xs uppercase tracking-widest';

const currentYear = new Date().getFullYear();

const buildDefaults = (initial?: MyProject): ProjectFormType => ({
  name: initial?.name ?? '',
  description: initial?.description ?? '',
  startYear: initial?.startYear ?? currentYear,
  clubId: initial?.club?.id ?? null,
  repositories: initial?.repositories ?? [],
  techStacks: initial?.techStacks ?? [],
  // 서버는 생략한 값을 원본 프로젝트 기준으로 채운다. 대기 중인 수정안이나 신규 신청을 다시 낼 때
  // 화면에 보이는 값과 달라지지 않도록 기존 값을 채워 그대로 보낸다.
  iconKey: initial?.iconKey ?? null,
  deploymentUrl: initial?.deploymentUrl ?? '',
});

const ProjectFormDialog = ({
  mode,
  initial,
  projectId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProjectFormDialogProps) => {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const { data: clubsData } = useGetMajorClubs({ enabled: open });
  const clubs = clubsData?.data.clubs ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormType>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: buildDefaults(initial),
  });

  useEffect(() => {
    if (open) reset(buildDefaults(initial));
  }, [open, initial, reset]);

  const handleSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ['me-projects'] });
    toast.success(message);
    setOpen(false);
  };

  const handleError = (error: unknown) => {
    const message = (error as { response?: { data?: BaseApiResponse } })?.response?.data?.message;
    toast.error(message || '요청을 처리하지 못했습니다.');
  };

  const { mutate: createProject, isPending: isCreating } = useCreateProject({
    onSuccess: () => handleSuccess('프로젝트 신청이 접수되었습니다.'),
    onError: handleError,
  });

  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject({
    onSuccess: () => handleSuccess('수정 신청이 접수되었습니다.'),
    onError: handleError,
  });

  const isPending = isCreating || isUpdating;

  const onSubmit = (form: ProjectFormType) => {
    const body: ProjectRequestBody = {
      name: form.name,
      description: form.description,
      startYear: form.startYear,
      clubId: form.clubId ?? NO_CLUB_ID,
      participantIds: [],
      repositories: form.repositories,
      techStacks: form.techStacks,
      // 빈 문자열은 삭제, 생략은 기존 값 유지라 비운 값은 ''로 보내야 지워진다.
      iconKey: form.iconKey ?? '',
      deploymentUrl: form.deploymentUrl,
    };

    if (projectId != null) {
      updateProject({ projectId, data: body });
    } else {
      createProject(body);
    }
  };

  const title = mode === 'create' ? '프로젝트 신청' : '프로젝트 수정 신청';
  const submitText = mode === 'create' ? '신청' : '수정 신청';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset(buildDefaults(initial));
      }}
    >
      {!isControlled && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn('flex max-h-[90vh] flex-col p-0 sm:max-w-xl')}>
        <DialogHeader className={cn('border-foreground shrink-0 border-b-2 px-6 py-5')}>
          <DialogTitle className={cn('font-pixel text-[14px] leading-none')}>{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn('min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6')}
        >
          <div className={cn('space-y-2')}>
            <Label className={cn(LABEL_STYLE)}>아이콘</Label>
            <Controller
              control={control}
              name="iconKey"
              render={({ field }) => (
                <ProjectIconField
                  initialUrl={mode === 'edit' ? initial?.iconUrl : null}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>

          <div className={cn('space-y-2')}>
            <Label htmlFor="name" className={cn(LABEL_STYLE)}>
              프로젝트 이름
            </Label>
            <Input
              id="name"
              maxLength={PROJECT_NAME_MAX_LENGTH}
              placeholder="프로젝트 이름"
              className={cn('border-foreground rounded-none font-mono')}
              {...register('name')}
              disabled={isPending}
            />
            <FormErrorMessage error={errors.name} />
          </div>

          <div className={cn('space-y-2')}>
            <Label htmlFor="description" className={cn(LABEL_STYLE)}>
              설명
            </Label>
            <Textarea
              id="description"
              rows={4}
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              placeholder="프로젝트 설명"
              className={cn('border-foreground rounded-none font-mono')}
              {...register('description')}
              disabled={isPending}
            />
            <FormErrorMessage error={errors.description} />
          </div>

          <div className={cn('space-y-2')}>
            <Label htmlFor="startYear" className={cn(LABEL_STYLE)}>
              서비스 시작 연도
            </Label>
            <Input
              id="startYear"
              type="number"
              placeholder={`${currentYear}`}
              className={cn('border-foreground rounded-none font-mono')}
              {...register('startYear', { valueAsNumber: true })}
              disabled={isPending}
            />
            <FormErrorMessage error={errors.startYear} />
          </div>

          <div className={cn('space-y-2')}>
            <Label className={cn(LABEL_STYLE)}>동아리</Label>
            <Controller
              control={control}
              name="clubId"
              render={({ field }) => (
                <Select
                  value={field.value === null ? 'NONE' : String(field.value)}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? null : Number(value))}
                  disabled={isPending}
                >
                  <SelectTrigger className={cn('border-foreground rounded-none')}>
                    <SelectValue placeholder="동아리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">무소속</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={String(club.id)}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className={cn('space-y-2')}>
            <Label htmlFor="deploymentUrl" className={cn(LABEL_STYLE)}>
              배포 URL
            </Label>
            <Input
              id="deploymentUrl"
              inputMode="url"
              maxLength={PROJECT_DEPLOYMENT_URL_MAX_LENGTH}
              placeholder="https://example.com"
              className={cn('border-foreground rounded-none font-mono')}
              {...register('deploymentUrl')}
              disabled={isPending}
            />
            <FormErrorMessage error={errors.deploymentUrl} />
          </div>

          <div className={cn('space-y-2')}>
            <Label className={cn(LABEL_STYLE)}>리포지토리</Label>
            <Controller
              control={control}
              name="repositories"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  maxItems={PROJECT_REPOSITORY_MAX_COUNT}
                  maxLength={PROJECT_REPOSITORY_MAX_LENGTH}
                  placeholder="리포지토리 링크 입력 후 Enter"
                  disabled={isPending}
                />
              )}
            />
            {errors.repositories?.message && (
              <p className={cn('text-destructive font-mono text-xs')}>
                {errors.repositories.message}
              </p>
            )}
          </div>

          <div className={cn('space-y-2')}>
            <Label className={cn(LABEL_STYLE)}>기술 스택</Label>
            <Controller
              control={control}
              name="techStacks"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  maxItems={PROJECT_TECH_STACK_MAX_COUNT}
                  maxLength={PROJECT_TECH_STACK_MAX_LENGTH}
                  placeholder="기술 스택 입력 후 Enter"
                  disabled={isPending}
                />
              )}
            />
            {errors.techStacks?.message && (
              <p className={cn('text-destructive font-mono text-xs')}>
                {errors.techStacks.message}
              </p>
            )}
          </div>

          <div className={cn('flex justify-end pt-2')}>
            <Button type="submit" disabled={isPending}>
              {isPending ? '처리 중...' : submitText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;
