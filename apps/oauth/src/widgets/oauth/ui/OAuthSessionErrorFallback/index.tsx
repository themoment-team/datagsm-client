import Link from 'next/link';

import { DOCS_URL, STATUS_URL } from '@repo/shared/constants';
import { AuthWindow, Button } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

interface OAuthSessionErrorFallbackProps {
  windowLabel: string;
  /**
   * `invalid`: 토큰이 없거나 401로 거부된 경우. 접근 자체가 잘못된 것이라 다시 로그인을 안내한다.
   * `unavailable`: 그 외 오류(서버 장애·네트워크 오류 등). 기술문서·서버 상태 페이지로 빠져나갈 수 있게 한다.
   */
  variant: 'invalid' | 'unavailable';
}

/** 세션 시작(서비스 정보 조회)에 실패했을 때 보여주는 안내 화면. */
const OAuthSessionErrorFallback = ({ windowLabel, variant }: OAuthSessionErrorFallbackProps) => {
  return (
    <AuthWindow windowLabel={windowLabel} title="오류">
      <div className={cn('flex flex-col gap-4 p-5')}>
        {variant === 'invalid' ? (
          <p className={cn('text-muted-foreground text-center font-mono text-sm')}>
            잘못되었거나 만료된 접근입니다.
            <br />
            서비스에서 다시 로그인을 시도해주세요.
          </p>
        ) : (
          <>
            <p className={cn('text-muted-foreground text-center font-mono text-sm')}>
              서비스 정보를 불러오지 못했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>
            <p className={cn('text-muted-foreground text-center text-xs leading-[18px]')}>
              문제가 계속된다면 서버 장애일 수 있습니다.
              <br />
              기술문서 또는 서버 상태를 확인해주세요.
            </p>

            <div className={cn('flex items-center gap-3')}>
              <Button asChild type="button" variant="pixel" size="lg" className={cn('flex-1')}>
                <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                  기술문서
                </Link>
              </Button>
              <Button asChild type="button" variant="pixel" size="lg" className={cn('flex-1')}>
                <Link href={STATUS_URL} target="_blank" rel="noopener noreferrer">
                  서버 상태 확인
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthWindow>
  );
};

export default OAuthSessionErrorFallback;
