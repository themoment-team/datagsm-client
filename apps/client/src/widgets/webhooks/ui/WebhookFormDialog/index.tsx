'use client';

import { useEffect, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
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
import { Pencil, Plus } from 'lucide-react';
import { FieldError, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  CreateWebhookData,
  WEBHOOK_EVENTS,
  Webhook,
  WebhookFormSchema,
  WebhookFormType,
} from '@/entities/webhooks';
import { useCreateWebhook, useUpdateWebhook, useWebhookEventSelection } from '@/widgets/webhooks';

interface WebhookFormDialogProps {
  mode: 'create' | 'edit';
  webhook?: Webhook;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateSuccess?: (data: CreateWebhookData) => void;
  disabled?: boolean;
}

const WebhookFormDialog = ({
  mode,
  webhook,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCreateSuccess,
  disabled,
}: WebhookFormDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const pendingFormData = useRef<WebhookFormType | null>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const queryClient = useQueryClient();

  const { isPending: isCreating, mutate: createWebhook } = useCreateWebhook({
    onSuccess: (data) => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('웹훅이 생성되었습니다.');
      onCreateSuccess?.(data.data);
    },
    onError: () => {
      toast.error('웹훅 생성에 실패했습니다.');
    },
  });

  const { isPending: isUpdating, mutate: updateWebhook } = useUpdateWebhook({
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('웹훅이 수정되었습니다.');
    },
    onError: () => {
      toast.error('웹훅 수정에 실패했습니다.');
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WebhookFormType>({
    resolver: zodResolver(WebhookFormSchema),
    defaultValues: {
      targetUrl: '',
      events: [],
    },
  });

  const { handleEventToggle, isEventChecked } = useWebhookEventSelection({ watch, setValue });

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!open) {
      isInitialized.current = false;
      return;
    }

    if (isInitialized.current) return;

    if (mode === 'edit' && webhook) {
      reset({
        targetUrl: webhook.target_url,
        events: [...webhook.events],
      });
      isInitialized.current = true;
    } else if (mode === 'create') {
      reset({
        targetUrl: '',
        events: [],
      });
      isInitialized.current = true;
    }
  }, [mode, webhook, open, reset]);

  const onSubmit = (data: WebhookFormType) => {
    if (mode === 'create') {
      createWebhook({
        target_url: data.targetUrl,
        events: data.events,
      });
    } else if (mode === 'edit') {
      pendingFormData.current = data;
      setIsConfirmOpen(true);
    }
  };

  const onConfirmSave = () => {
    const data = pendingFormData.current;
    if (!data || !webhook) return;
    updateWebhook(
      {
        webhookId: webhook.id,
        data: {
          target_url: data.targetUrl,
          events: data.events,
        },
      },
      { onSettled: () => setIsConfirmOpen(false) },
    );
  };

  const isPending = isCreating || isUpdating;
  const title = mode === 'create' ? 'ADD WEBHOOK' : 'EDIT WEBHOOK';
  const submitText = mode === 'create' ? '추가' : '저장';

  const defaultTrigger =
    mode === 'create' ? (
      <Button size="sm" className={cn('gap-2')} disabled={disabled}>
        <Plus className={cn('h-4 w-4')} />
        웹훅 추가
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <Pencil className={cn('h-4 w-4')} />
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
      <DialogContent className={cn('max-h-[90vh] max-w-lg p-0')}>
        <DialogHeader className={cn('border-foreground border-b-2 px-6 py-5')}>
          <DialogTitle className={cn('font-pixel text-[14px] leading-none')}>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6 px-6 py-6')}>
          <div className={cn('space-y-2')}>
            <Label
              htmlFor="targetUrl"
              className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
            >
              수신 URL
            </Label>
            <Input
              id="targetUrl"
              placeholder="https://example.com/webhooks/datagsm"
              className={cn('border-foreground rounded-none font-mono')}
              {...register('targetUrl')}
            />
            <FormErrorMessage error={errors.targetUrl} />
          </div>

          {mode === 'edit' && webhook && (
            <div className={cn('space-y-2')}>
              <Label
                className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
              >
                웹훅 ID
              </Label>
              <code
                className={cn(
                  'bg-muted text-muted-foreground border-foreground/30 block rounded-none border px-3 py-2 font-mono text-sm',
                )}
              >
                {webhook.id}
              </code>
            </div>
          )}

          <div className={cn('space-y-2')}>
            <Label
              className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
            >
              구독 이벤트
            </Label>
            <p className={cn('text-muted-foreground text-xs')}>
              이 웹훅으로 전달받을 이벤트를 선택하세요.
            </p>

            <div
              className={cn(
                'border-foreground sidebar-scrollbar mt-2 max-h-60 space-y-2 overflow-y-auto rounded-none border-2 p-4',
              )}
            >
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.value} className={cn('flex items-center gap-3')}>
                  <Checkbox
                    id={`${mode}-${event.value}`}
                    checked={isEventChecked(event.value)}
                    onCheckedChange={() => handleEventToggle(event.value)}
                  />
                  <div className={cn('flex-1')}>
                    <label htmlFor={`${mode}-${event.value}`} className={cn('block cursor-pointer')}>
                      <p className={cn('text-sm font-mono leading-none')}>{event.label}</p>
                      <p className={cn('text-muted-foreground mt-0.5 text-xs')}>
                        {event.description}
                      </p>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <FormErrorMessage error={errors.events as unknown as FieldError} />
          </div>

          <div className={cn('flex justify-end pt-2')}>
            {mode === 'edit' ? (
              <>
                <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>웹훅 수정</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말로 이 웹훅 정보를 수정하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={onConfirmSave}>저장</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit" disabled={isPending}>
                  저장
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={isPending}>
                {submitText}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookFormDialog;
