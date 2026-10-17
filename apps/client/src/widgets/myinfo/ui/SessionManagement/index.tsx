'use client';

import { oauthQueryKeys } from '@repo/shared/api';
import { COOKIE_KEYS } from '@repo/shared/constants';
import { ConfirmDialog, SectionCard, Skeleton } from '@repo/shared/ui';
import { cn, deleteCookie, formatDate } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Monitor } from 'lucide-react';
import { toast } from 'sonner';

import { useDeleteIdpSession, useGetIdpSessions } from '@/widgets/myinfo';

export const SessionManagement = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useGetIdpSessions();
  const sessions = data?.data?.sessions;

  const {
    mutate: deleteSession,
    isPending,
    variables,
  } = useDeleteIdpSession({
    onSuccess: (_data, { isCurrent }) => {
      if (isCurrent) {
        queryClient.clear();
        deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
        deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);
        toast.success('로그아웃 되었습니다.');
        window.location.href = '/';
        return;
      }

      toast.success('세션을 종료했습니다.');
      queryClient.invalidateQueries({ queryKey: oauthQueryKeys.getIdpSessions() });
    },
    onError: () => {
      toast.error('세션 종료에 실패했습니다.');
    },
  });

  return (
    <SectionCard title="세션 관리" icon={<Monitor />}>
      {isLoading ? (
        <div className={cn('flex flex-col gap-2 p-5')}>
          <Skeleton className={cn('h-14 w-full')} />
          <Skeleton className={cn('h-14 w-full')} />
        </div>
      ) : isError || !sessions ? (
        <p className={cn('text-muted-foreground px-5 py-6 text-center font-mono text-sm')}>
          세션 목록을 불러오지 못했습니다.
        </p>
      ) : sessions.length === 0 ? (
        <p className={cn('text-muted-foreground px-5 py-6 text-center font-mono text-sm')}>
          {'// 활성 세션이 없습니다'}
        </p>
      ) : (
        <ul>
          {sessions.map((session) => {
            const isRowPending = isPending && variables?.sessionId === session.sessionId;

            return (
              <li
                key={session.sessionId}
                className={cn(
                  'border-foreground/10 flex items-center justify-between gap-4 border-b px-5 py-4 last:border-b-0',
                )}
              >
                <div className={cn('min-w-0')}>
                  <div className={cn('flex flex-wrap items-center gap-2')}>
                    <p className={cn('truncate text-sm font-medium')}>
                      {session.userAgent ?? '알 수 없는 기기'}
                    </p>
                    {session.current && (
                      <span
                        className={cn(
                          'border-foreground/25 border px-1.5 py-0.5 font-mono text-xs uppercase',
                        )}
                      >
                        현재 세션
                      </span>
                    )}
                  </div>
                  <p className={cn('text-muted-foreground mt-1 font-mono text-xs')}>
                    {session.createdAt ? formatDate(session.createdAt) : '생성일 알 수 없음'}
                  </p>
                </div>

                {/* 서버는 IdP 세션만 지우고 그 기기가 이미 받은 토큰은 폐기하지 않는다.
                    기기가 로그아웃된다고 오해하지 않도록 남는 로그인 범위를 경고로 보여 준다. */}
                <ConfirmDialog
                  windowTitle="Session"
                  title="세션을 종료하시겠습니까?"
                  warning={
                    session.current
                      ? '현재 사용 중인 세션입니다. 종료하면 이 서비스에서 로그아웃되고, 새 서비스에 로그인할 때 비밀번호를 다시 입력해야 합니다. 이미 로그인된 다른 서비스는 로그인 상태가 유지될 수 있습니다.'
                      : '해당 기기는 새 서비스에 로그인할 때 비밀번호를 다시 입력해야 합니다. 이미 로그인된 서비스는 로그인 상태가 유지될 수 있습니다.'
                  }
                  confirmLabel="종료"
                  onConfirm={() =>
                    deleteSession({ sessionId: session.sessionId, isCurrent: session.current })
                  }
                  trigger={
                    <button
                      type="button"
                      disabled={isRowPending}
                      className={cn(
                        'border-destructive bg-background text-destructive hover:bg-destructive shrink-0 whitespace-nowrap border-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-50',
                      )}
                    >
                      {isRowPending ? '종료 중...' : '종료'}
                    </button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
};
