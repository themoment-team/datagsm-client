'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { oauthUrl } from '@repo/shared/api';
import { OAuthConsentRequest, OAuthConsentSuccessResponse } from '@repo/shared/types';
import { AuthWindow, Button, Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { toast } from 'sonner';

import { OAuthSessionErrorFallback, useGetOAuthSession } from '@/widgets/oauth';

const OAuthConsentForm = () => {
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    data: sessionResponse,
    isLoading: isLoadingServiceInfo,
    isError: isSessionError,
  } = useGetOAuthSession(token);
  const sessionData = sessionResponse?.data;
  const serviceName = sessionData?.serviceName;
  const serviceScope = sessionData?.requestedScopes;

  const submitConsent = async (approved: boolean) => {
    if (!token) {
      toast.error('잘못된 접근입니다. 서비스에서 다시 로그인을 시도해주세요.');
      return;
    }

    setIsPending(true);

    const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;

    if (!oauthBaseUrl) {
      setIsPending(false);
      toast.error('OAuth 서버 설정이 올바르지 않습니다.');
      return;
    }

    try {
      // 세션 쿠키는 백엔드 호스트에 host-only로 심겨 있어 BFF로는 전달할 수 없다.
      // 그래서 이 요청은 BFF를 거치지 않고 브라우저에서 백엔드로 직접 나간다.
      //
      // 성공 시 백엔드는 302가 아니라 200 + { redirectUrl }을 내려준다. fetch가
      // 302를 그대로 따라가면 외부 서비스 도메인에서 CORS로 막히거나(credentials
      // 포함 크로스오리진 리다이렉트) 1회용 code가 fetch에서 먼저 소진돼버려서,
      // 최종 이동은 항상 이 JSON을 받아 프론트가 직접 window.location으로 한다.
      const payload: OAuthConsentRequest = { token, approved };
      const response = await fetch(`${oauthBaseUrl}${oauthUrl.postAuthorizeConsent()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
        redirect: 'manual',
      });

      if (response.type === 'opaqueredirect') {
        setIsPending(false);
        toast.error('서버 응답 형식이 예상과 다릅니다. 백엔드 배포 상태를 확인해주세요.');
        return;
      }

      if (response.ok) {
        const { redirectUrl } = (await response.json()) as OAuthConsentSuccessResponse;

        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        setIsPending(false);
        toast.error('응답이 올바르지 않습니다. 다시 시도해주세요.');
        return;
      }

      setIsPending(false);

      if (response.status === 401) {
        toast.error('인증 세션이 만료되었습니다. 서비스에서 다시 로그인을 시도해주세요.');
        return;
      }

      toast.error('요청을 처리하지 못했습니다. 다시 시도해주세요.');
    } catch (error) {
      setIsPending(false);
      if (error instanceof Error) {
        toast.error(error.message || '네트워크 오류가 발생했습니다.');
      } else {
        toast.error('알 수 없는 네트워크 오류가 발생했습니다.');
      }
    }
  };

  if (!token || isSessionError) {
    return <OAuthSessionErrorFallback windowLabel="Consent" />;
  }

  return (
    <AuthWindow
      windowLabel="Consent"
      title="접근 권한 동의"
      isPending={isPending}
      description={
        isLoadingServiceInfo ? (
          <Skeleton className={cn('h-4 w-48')} />
        ) : (
          <div className={cn('flex flex-col gap-1')}>
            <p className={cn('text-muted-foreground text-xs leading-[18px]')}>
              <strong className={cn('font-semibold')}>{serviceName || 'DataGSM'}</strong>에서 다음
              권한을 요청합니다.
            </p>
            {serviceScope && serviceScope.length > 0 && (
              <ul className={cn('flex flex-col gap-1')}>
                {serviceScope.map((scope) => (
                  <li
                    key={scope.scope}
                    className={cn(
                      'text-muted-foreground flex items-center gap-2.5 text-xs leading-4',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn('bg-muted-foreground size-0.5 flex-shrink-0 rounded-full')}
                    />
                    {scope.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      }
    >
      <div className={cn('flex items-center gap-3 p-5')}>
        <Button
          type="button"
          variant="pixel"
          size="lg"
          className={cn('flex-1')}
          disabled={isPending || isLoadingServiceInfo}
          onClick={() => submitConsent(false)}
        >
          거부
        </Button>
        <Button
          type="button"
          variant="pixel-solid"
          size="lg"
          className={cn('flex-1')}
          disabled={isPending || isLoadingServiceInfo}
          onClick={() => submitConsent(true)}
        >
          {isPending ? '처리 중...' : '승인'}
        </Button>
      </div>
    </AuthWindow>
  );
};

export default OAuthConsentForm;
