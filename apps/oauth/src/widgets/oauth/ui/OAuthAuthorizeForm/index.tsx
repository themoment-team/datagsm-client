'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { ApiResponse, SignInFormType } from '@repo/shared/types';
import { SignInForm } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { toast } from 'sonner';

import {
  DataEditFieldSpec,
  DataEditPayload,
  DataEditRequirementsResponse,
  STUDENT_DATA_EDIT_FIELDS,
} from '@/entities/data-edit';
import { DataEditForm, OAuthSessionErrorFallback, useGetOAuthSession } from '@/widgets/oauth';

const BUFFER_TIME_MS = 30000;
const STORAGE_KEY = 'oauth_session_timestamp';

const OAuthAuthorizeForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [credentials, setCredentials] = useState<SignInFormType | null>(null);
  const [dataEditFields, setDataEditFields] = useState<DataEditFieldSpec[] | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const sessionExpiresAt = useRef<number | null>(null);
  const hasShownExpiredToast = useRef(false);
  const {
    data: sessionResponse,
    isLoading: isLoadingServiceInfo,
    isError: isSessionError,
    error: sessionError,
  } = useGetOAuthSession(token);
  // 토큰이 없거나 거부(401)된 접근은 서버 장애가 아니라 잘못된 링크다. 재로그인만 안내한다.
  const isInvalidAccess = !token || sessionError?.response?.status === 401;
  const sessionData = sessionResponse?.data;
  const serviceName = sessionData?.serviceName;
  const serviceScope = sessionData?.requestedScopes;

  const updateRemainingTime = useCallback(() => {
    if (!sessionExpiresAt.current) return false;

    const now = Date.now();
    const clientExpiresAt = sessionExpiresAt.current - BUFFER_TIME_MS;
    const remaining = Math.max(0, Math.ceil((clientExpiresAt - now) / 1000));

    setRemainingTime(remaining);

    if (remaining <= 0) {
      setIsExpired(true);
      if (!hasShownExpiredToast.current) {
        hasShownExpiredToast.current = true;
        toast.error('인증 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
      }
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    if (
      !sessionData?.expiresAt ||
      !sessionData?.serviceName ||
      !sessionData?.requestedScopes ||
      !token
    )
      return;

    const { expiresAt, serviceName, requestedScopes } = sessionData;
    sessionExpiresAt.current = expiresAt;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token,
        expiresAt,
        serviceName,
        requestedScopes,
      }),
    );

    updateRemainingTime();
  }, [
    sessionData,
    sessionData?.expiresAt,
    sessionData?.serviceName,
    sessionData?.requestedScopes,
    token,
    updateRemainingTime,
  ]);

  useEffect(() => {
    if (isExpired) return;

    const timer = setInterval(() => {
      const expired = updateRemainingTime();
      if (expired) clearInterval(timer);
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRemainingTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isExpired, updateRemainingTime]);

  /** authorize 제출. 정보 수정 값이 있으면 함께 실어 보낸다. */
  const submitAuthorize = async (credentials: SignInFormType, dataEdit?: DataEditPayload) => {
    // 정보 변경 값을 실어 보내는 재제출인지. 오류 해석이 최초 로그인과 다르다.
    const isDataEditSubmit = Boolean(dataEdit);

    if (isExpired) {
      toast.error('세션이 만료되었습니다. 다시 시도해주세요.');
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          token: token,
          ...dataEdit,
        }),
        credentials: 'same-origin',
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.removeItem(STORAGE_KEY);

        if (responseData.redirect_url) {
          window.location.href = responseData.redirect_url;
          return;
        }

        // 2xx인데 이동할 주소가 없으면 더 진행할 수 없다.
        // 여기서 끝내지 않으면 isPending이 켜진 채로 폼이 영구히 잠긴다.
        setIsPending(false);
        toast.error('로그인 응답이 올바르지 않습니다. 다시 시도해주세요.');
        return;
      }

      if (!response.ok) {
        // 미해소된 정보 수정 요청이 있으면 서버가 422로 로그인을 막는다.
        if (response.status === 422) {
          await enterDataEditStep(credentials);
          return;
        }

        setIsPending(false);
        switch (response.status) {
          case 400:
            // 재제출의 400은 세션이 아니라 입력값 문제다.
            // 만료로 처리하면 입력 중이던 정보 변경 폼이 통째로 사라진다.
            if (isDataEditSubmit) {
              toast.error('입력한 정보를 저장하지 못했습니다. 값을 확인하고 다시 시도해주세요.');
              break;
            }

            toast.error('세션이 만료되었습니다. 다시 시도해주세요.');
            setIsExpired(true);
            break;
          case 401:
            toast.error('이메일 또는 비밀번호가 일치하지 않습니다.');
            break;
          case 403:
            toast.error('승인 대기 중인 계정입니다. 관리자 승인 후 로그인할 수 있습니다.');
            break;
          default:
            toast.error('로그인에 실패했습니다.');
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || '네트워크 오류가 발생했습니다.');
      } else {
        toast.error('알 수 없는 네트워크 오류가 발생했습니다.');
      }
      setIsPending(false);
    }
  };

  /** 입력받아야 할 필드를 조회하고 정보 변경 단계로 넘어간다. */
  const enterDataEditStep = async (credentials: SignInFormType) => {
    const response = await fetch('/api/oauth/data-edit-requirements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      credentials: 'same-origin',
    });

    setIsPending(false);

    if (!response.ok) {
      toast.error('정보 변경 항목을 불러오지 못했습니다. 다시 시도해주세요.');
      return;
    }

    // 서버는 모든 응답을 { status, code, message, data }로 감싼다.
    const { data } = (await response.json()) as Partial<ApiResponse<DataEditRequirementsResponse>>;
    const fields = data?.fields;

    if (!fields?.length) {
      toast.error('정보 변경 항목을 불러오지 못했습니다. 다시 시도해주세요.');
      return;
    }

    // 필드 목록은 서버와 손으로 맞추는 enum이라, 화면이 아직 모르는 항목이 올 수 있다.
    // 아는 항목만 골라 제출하면 요청이 해소되지 않아 서버가 다시 422로 막고,
    // 사용자는 같은 화면을 오가며 로그인을 끝내지 못한다. 하나라도 모르면 진입하지 않는다.
    const hasUnknownField = fields.some(({ name }) => !STUDENT_DATA_EDIT_FIELDS.includes(name));

    if (hasUnknownField) {
      toast.error('현재 지원하지 않는 정보 변경 항목입니다. 관리자에게 문의하세요.');
      return;
    }

    // 비밀번호는 재제출에 필요해 메모리로만 들고 간다. 새로고침하면 로그인부터 다시 한다.
    setCredentials(credentials);
    setDataEditFields(fields);
  };

  if (isInvalidAccess) {
    return <OAuthSessionErrorFallback windowLabel="Sign In" variant="invalid" />;
  }

  if (isSessionError) {
    return <OAuthSessionErrorFallback windowLabel="Sign In" variant="unavailable" />;
  }

  return (
    <div className="max-w-180 relative flex w-full flex-col items-center gap-6">
      {dataEditFields && credentials ? (
        <DataEditForm
          fields={dataEditFields}
          isPending={isPending}
          onSubmit={(payload) => submitAuthorize(credentials, payload)}
        />
      ) : (
        <SignInForm
          onSubmit={(data) => submitAuthorize(data)}
          isPending={isPending}
          signupHref="/signup"
          resetHref="/signin/reset-password"
          serviceName={serviceName || undefined}
          serviceScope={serviceScope}
          isLoadingServiceInfo={isLoadingServiceInfo}
          remainingTime={remainingTime}
        />
      )}

      {isExpired && (
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
      )}
    </div>
  );
};

export default OAuthAuthorizeForm;
