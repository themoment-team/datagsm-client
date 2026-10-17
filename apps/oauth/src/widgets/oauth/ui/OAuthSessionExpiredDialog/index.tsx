import { cn } from '@repo/shared/utils';

/** 인증 세션이 만료돼 더 진행할 수 없을 때 화면 전체를 덮는 안내. */
const OAuthSessionExpiredDialog = () => {
  return (
    <div
      className={cn(
        'bg-background fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm',
      )}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-description"
        className={cn('border-destructive bg-background max-w-100 w-full border-2')}
      >
        <div className={cn('bg-destructive flex items-center gap-3 px-4 py-3')}>
          <div
            className={cn(
              'bg-background text-destructive font-pixel flex size-6 flex-shrink-0 items-center justify-center text-[8px]',
            )}
          >
            D
          </div>
          <span className={cn('text-background font-pixel text-[9px]')}>DataGSM</span>
          <span className={cn('text-background font-pixel text-[9px]')}>Session</span>
          <span className={cn('text-background font-pixel text-[9px]')}>Expiration</span>
        </div>

        <div className={cn('flex flex-col items-center gap-2 p-5 text-center')}>
          <h2
            id="session-expired-title"
            className={cn('text-destructive text-xl font-semibold leading-[1.45]')}
          >
            인증 세션 만료
          </h2>
          <p
            id="session-expired-description"
            className={cn('text-muted-foreground text-xs leading-[18px]')}
          >
            보안을 위해 인증 세션이 만료되었습니다.
            <br />이 창을 닫고 서비스에서 다시 로그인을 시도하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthSessionExpiredDialog;
