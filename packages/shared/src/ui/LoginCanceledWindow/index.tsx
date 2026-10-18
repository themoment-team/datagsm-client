'use client';

import { useSearchParams } from 'next/navigation';

import { AuthWindow, Button } from '@repo/shared/ui';
import { cn, isValidRelativePath } from '@repo/shared/utils';

interface LoginCanceledWindowProps {
  /**
   * 로그인을 시작하는 경로. 돌아갈 경로를 `returnTo` 쿼리로 붙여 보낸다.
   * 넘기지 않으면 돌아갈 경로로 바로 보낸다. 로그인하지 않고 들어가면
   * 미들웨어가 인가를 시작하는 앱(admin·client)은 넘기지 않는다.
   */
  loginPath?: string;
}

/**
 * OAuth 콜백이 인가 서버의 오류(동의 거부 등)를 받았을 때 보여 주는 안내 화면.
 * 콜백이 넘긴 `error`로 문구를 고르고, `returnTo`로 돌아가도록 다시 로그인을 시작하게 한다.
 */
function LoginCanceledWindow({ loginPath }: LoginCanceledWindowProps) {
  const searchParams = useSearchParams();
  // access_denied는 사용자가 동의 화면에서 거부한 경우다. 그 외 값은 인가 서버가 요청을 처리하지 못한 경우다.
  const isDenied = searchParams.get('error') === 'access_denied';
  const returnTo = searchParams.get('returnTo');
  // 주소를 직접 고쳐 들어올 수도 있으니 콜백이 검증한 값이라도 다시 확인한다.
  const returnPath = returnTo && isValidRelativePath(returnTo) ? returnTo : '/';
  const loginHref = loginPath
    ? `${loginPath}?returnTo=${encodeURIComponent(returnPath)}`
    : returnPath;

  return (
    <div
      className={cn(
        'bg-background flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4',
      )}
    >
      <AuthWindow
        windowLabel="Sign In"
        title={isDenied ? '로그인 취소' : '로그인 실패'}
        description={
          isDenied
            ? '접근 권한 요청을 거부해 로그인이 취소되었습니다. 서비스를 이용하려면 다시 로그인해주세요.'
            : '로그인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'
        }
      >
        <div className={cn('flex items-center gap-3 p-5')}>
          {/* 로그인은 미들웨어나 서버 라우트의 리다이렉트로 시작한다.
              next/link의 클라이언트 이동 대신 <a>로 페이지 전체를 이동한다. */}
          <Button asChild type="button" variant="pixel-solid" size="lg" className={cn('flex-1')}>
            <a href={loginHref}>다시 로그인</a>
          </Button>
        </div>
      </AuthWindow>
    </div>
  );
}

export { LoginCanceledWindow };
