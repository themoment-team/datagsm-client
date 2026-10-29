'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { logoutLocally } from '@repo/shared/lib';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Label,
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { WithdrawalFormType, WithdrawalSchema } from '@/entities/mypage';

import { useWithdrawal } from '../../model/useWithdrawal';

export const WithdrawalSection = () => {
  const [open, setOpen] = useState(false);
  const { mutate: withdraw, isPending } = useWithdrawal({
    onSuccess: async () => {
      toast.success('회원 탈퇴가 완료되었습니다.');
      try {
        await logoutLocally();
      } catch {
        // 계정은 이미 삭제됐으므로 쿠키를 지우지 못해도 새로고침한다.
      }
      window.location.reload();
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        toast.error('비밀번호가 일치하지 않습니다.');
      } else {
        toast.error('오류가 발생했습니다.');
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WithdrawalFormType>({
    resolver: zodResolver(WithdrawalSchema),
  });

  const onSubmit = (data: WithdrawalFormType) => {
    withdraw(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <div className={cn('mt-12 border-t-2 border-foreground/20 pt-8')}>
      <div className={cn('flex flex-col items-start justify-between gap-4 border-2 border-destructive/30 p-6')}>
        <div>
          <h3 className={cn('flex items-center gap-2 text-destructive font-pixel text-[11px]')}>
            <AlertTriangle className={cn('h-4 w-4')} />
            위험 구역
          </h3>
          <p className={cn('mt-2 text-sm text-muted-foreground font-mono')}>
            계정을 삭제하면 모든 데이터가 영구적으로 제거되며 복구할 수 없습니다.
          </p>
        </div>

        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button className={cn('border-2 border-destructive bg-destructive hover:bg-background hover:text-destructive font-mono text-xs uppercase tracking-widest')}>
              회원 탈퇴
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AlertDialogHeader>
                <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  탈퇴를 확인하기 위해 비밀번호를 입력해주세요.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className={cn('my-6 space-y-2')}>
                <Label htmlFor="password" className={cn('text-xs uppercase tracking-widest text-muted-foreground font-mono')}>비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  {...register('password')}
                  className={cn('rounded-none border-foreground', errors.password && 'border-destructive')}
                />
                {errors.password && (
                  <p className={cn('text-xs text-destructive font-mono')}>{errors.password.message}</p>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel type="button">취소</AlertDialogCancel>
                <Button
                  type="submit"
                  className={cn('border-2 border-destructive bg-destructive hover:bg-background hover:text-destructive font-mono text-xs uppercase tracking-widest')}
                  disabled={isPending}
                >
                  {isPending ? '처리 중...' : '계정 삭제'}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
