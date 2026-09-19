'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { BaseApiResponse } from '@repo/shared/types';
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
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, X } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Application, ApplicationFormSchema, ApplicationFormType } from '@/entities/application';
import {
  useCreateApplication,
  useCreateApplicationScope,
  useDeleteApplicationScope,
  useUpdateApplicationName,
  useUpdateApplicationScope,
} from '@/widgets/application';

interface ApplicationFormDialogProps {
  mode: 'create' | 'edit';
  application?: Application;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ApplicationFormDialog = ({
  mode,
  application,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ApplicationFormDialogProps) => {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const { mutate: createApplication, isPending: isCreatePending } = useCreateApplication({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['applications', 'list'],
      });
      toast.success('애플리케이션이 생성되었습니다.');
      setOpen(false);
      reset();
    },
    onError: (error) => {
      const message =
        (error?.response?.data as BaseApiResponse)?.message || '애플리케이션 생성에 실패했습니다.';
      toast.error(message);
    },
  });

  const { mutateAsync: updateApplicationName } = useUpdateApplicationName();
  const { mutateAsync: updateApplicationScope } = useUpdateApplicationScope();
  const { mutateAsync: deleteApplicationScope } = useDeleteApplicationScope();
  const { mutateAsync: createApplicationScope } = useCreateApplicationScope();

  const [isUpdatePending, setIsUpdatePending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormType>({
    resolver: zodResolver(ApplicationFormSchema),
    defaultValues: {
      applicationName: '',
      applicationScopes: [{ applicationScope: '', applicationDescription: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'applicationScopes',
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && application) {
      reset({
        applicationName: application.applicationName,
        applicationScopes: application.applicationScopes,
      });
    } else if (mode === 'create') {
      reset({
        applicationName: '',
        applicationScopes: [{ applicationScope: '', applicationDescription: '' }],
      });
    }
  }, [mode, application, open, reset]);

  const onSubmit = async (data: ApplicationFormType) => {
    if (mode === 'create') {
      createApplication({
        name: data.applicationName,
        scopes: data.applicationScopes.map((scope) => ({
          scopeName: scope.applicationScope,
          description: scope.applicationDescription,
        })),
      });
    } else if (mode === 'edit' && application) {
      setIsUpdatePending(true);
      try {
        const submittedScopes = data.applicationScopes.map((scope, index) => ({
          ...scope,
          scopeId: fields[index]?.scopeId,
        }));

        // 1. 삭제 작업 먼저 수행 (이름 충돌 방지)
        const currentScopeIds = submittedScopes
          .map((s) => s.scopeId)
          .filter((id): id is number => id !== undefined);

        const deletedScopes = application.applicationScopes.filter(
          (original) =>
            original.scopeId !== undefined && !currentScopeIds.includes(original.scopeId),
        );

        if (deletedScopes.length > 0) {
          await Promise.all(
            deletedScopes.map((scope) =>
              deleteApplicationScope({
                applicationId: application.id,
                scopeId: scope.scopeId!,
              }),
            ),
          );
        }

        // 2. 수정 및 생성 작업 수행
        const updateAndCreatePromises: Promise<BaseApiResponse>[] = [];

        // 이름 수정 확인
        if (data.applicationName.trim() !== application.applicationName.trim()) {
          updateAndCreatePromises.push(
            updateApplicationName({
              id: application.id,
              data: { name: data.applicationName.trim() },
            }),
          );
        }

        // Scope 수정 또는 추가 확인
        for (const scope of submittedScopes) {
          if (scope.scopeId) {
            // 수정 대상 비교 (공백 제거 후 비교)
            const original = application.applicationScopes.find((s) => s.scopeId === scope.scopeId);
            if (
              original &&
              (original.applicationScope.trim() !== scope.applicationScope.trim() ||
                original.applicationDescription.trim() !== scope.applicationDescription.trim())
            ) {
              updateAndCreatePromises.push(
                updateApplicationScope({
                  applicationId: application.id,
                  scopeId: scope.scopeId,
                  data: {
                    scopeName: scope.applicationScope.trim(),
                    description: scope.applicationDescription.trim(),
                  },
                }),
              );
            }
          } else {
            // scope 추가
            updateAndCreatePromises.push(
              createApplicationScope({
                applicationId: application.id,
                data: {
                  scopeName: scope.applicationScope.trim(),
                  description: scope.applicationDescription.trim(),
                },
              }),
            );
          }
        }

        if (updateAndCreatePromises.length > 0 || deletedScopes.length > 0) {
          if (updateAndCreatePromises.length > 0) {
            await Promise.all(updateAndCreatePromises);
          }

          queryClient.invalidateQueries({
            queryKey: ['applications', 'list'],
          });
          toast.success('애플리케이션이 수정되었습니다.');
        } else {
          toast.info('변경사항이 없습니다.');
        }

        setOpen(false);
      } catch (error) {
        let message = '애플리케이션 수정 중 오류가 발생했습니다.';
        if (axios.isAxiosError(error)) {
          message = (error.response?.data as BaseApiResponse)?.message || message;
        }
        toast.error(message);
      } finally {
        setIsUpdatePending(false);
      }
    }
  };

  const title = mode === 'create' ? 'ADD APPLICATION' : 'EDIT APPLICATION';
  const submitText = mode === 'create' ? '추가' : '저장';
  const isPending = isCreatePending || isUpdatePending;

  const defaultTrigger = (
    <Button size="sm" className={cn('gap-2')}>
      <Plus className={cn('h-4 w-4')} />
      애플리케이션 추가
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      {!isControlled && <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>}
      <DialogContent className={cn('flex max-h-[90vh] flex-col p-0 sm:max-w-xl')}>
        <DialogHeader className={cn('border-foreground shrink-0 border-b-2 px-6 py-5')}>
          <DialogTitle className={cn('font-pixel text-[14px] leading-none')}>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn('min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6')}
        >
          <div className={cn('space-y-2')}>
            <Label
              htmlFor="applicationName"
              className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
            >
              애플리케이션 이름
            </Label>
            <Input
              id="applicationName"
              placeholder="애플리케이션 이름 입력"
              className={cn('border-foreground rounded-none font-mono')}
              {...register('applicationName')}
              disabled={isPending}
            />
            <FormErrorMessage error={errors.applicationName} />
          </div>

          <div className={cn('space-y-4')}>
            <div className={cn('flex items-center justify-between')}>
              <Label
                className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
              >
                권한 범위 (Scopes)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ applicationScope: '', applicationDescription: '' })}
                className={cn('h-8')}
                disabled={isPending}
              >
                <Plus className={cn('mr-1 h-3 w-3')} />
                Scope 추가
              </Button>
            </div>

            <div className={cn('sidebar-scrollbar max-h-80 space-y-4 overflow-y-auto pr-2')}>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={cn('border-foreground relative space-y-2 border-2 p-4 pt-8')}
                >
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className={cn('absolute right-1 top-1 h-6 w-6')}
                      disabled={isPending}
                    >
                      <X className={cn('h-4 w-4')} />
                    </Button>
                  )}

                  <div className={cn('space-y-1')}>
                    <Label className={cn('text-muted-foreground text-[10px] uppercase')}>
                      Scope 이름
                    </Label>
                    <Input
                      placeholder="예: user_read"
                      className={cn('border-foreground rounded-none font-mono text-sm')}
                      {...register(`applicationScopes.${index}.applicationScope` as const)}
                      disabled={isPending}
                    />
                    <FormErrorMessage error={errors.applicationScopes?.[index]?.applicationScope} />
                  </div>

                  <div className={cn('space-y-1')}>
                    <Label className={cn('text-muted-foreground text-[10px] uppercase')}>
                      Scope 설명
                    </Label>
                    <Input
                      placeholder="권한에 대한 설명 입력"
                      className={cn('border-foreground rounded-none font-mono text-sm')}
                      {...register(`applicationScopes.${index}.applicationDescription` as const)}
                      disabled={isPending}
                    />
                    <FormErrorMessage
                      error={errors.applicationScopes?.[index]?.applicationDescription}
                    />
                  </div>
                </div>
              ))}
              {errors.applicationScopes?.root && (
                <FormErrorMessage error={errors.applicationScopes.root} />
              )}
            </div>
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

export default ApplicationFormDialog;
