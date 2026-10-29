'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorCode, minutesToMs } from '@repo/shared/utils';
import { toast } from 'sonner';

import { getRateLimitMessage } from './rateLimit';
import { useCheckEmailCode } from './useCheckEmailCode';
import { useSendEmailCode } from './useSendEmailCode';

const RESEND_COOLDOWN_MS = minutesToMs(5);
const STORAGE_KEY = 'email_verification_timestamp';

interface UseEmailVerificationParams {
  /** 인증 시간이 만료돼 코드가 무효해졌을 때 호출됩니다. (입력값 초기화용) */
  onCodeExpired?: () => void;
  /**
   * 코드가 틀리거나 만료된 게 아니라 요청 한도·서버 오류로 확인에 실패했을 때 호출됩니다.
   * 같은 코드로 다시 확인할 수 있게 하는 용도입니다.
   */
  onVerifyRetryable?: () => void;
}

/**
 * 회원가입 이메일 인증 상태를 관리합니다.
 * 코드 전송 후 5분 재전송 쿨다운을 localStorage에 남겨 새로고침에도 유지합니다.
 */
export const useEmailVerification = ({
  onCodeExpired,
  onVerifyRetryable,
}: UseEmailVerificationParams = {}) => {
  const [codeSent, setCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const hasShownExpiredToast = useRef(false);
  const onCodeExpiredRef = useRef(onCodeExpired);
  onCodeExpiredRef.current = onCodeExpired;

  useEffect(() => {
    const lastSentTime = localStorage.getItem(STORAGE_KEY);
    if (!lastSentTime) return;

    const elapsed = Date.now() - parseInt(lastSentTime, 10);
    if (elapsed < RESEND_COOLDOWN_MS) {
      setCodeSent(true);
      setRemainingTime(Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev > 1) return prev - 1;

        localStorage.removeItem(STORAGE_KEY);
        setCodeSent(false);
        setIsCodeVerified((verified) => {
          if (verified) return verified;

          onCodeExpiredRef.current?.();
          if (!hasShownExpiredToast.current) {
            hasShownExpiredToast.current = true;
            toast.error('인증 시간이 만료되었습니다. 다시 인증해주세요.');
          }
          return false;
        });
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  const { mutate: sendEmailCode, isPending: isSendingCode } = useSendEmailCode({
    onSuccess: () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCodeSent(true);
      setRemainingTime(RESEND_COOLDOWN_MS / 1000);
      hasShownExpiredToast.current = false;
      toast.success('인증 코드가 이메일로 전송되었습니다.');
    },
    onError: (error: unknown) => {
      switch (getApiErrorCode(error)) {
        case 400:
          toast.error('이메일 형식을 확인해주세요.');
          break;
        case 409:
          toast.error('이미 해당 이메일을 가진 계정이 존재합니다.');
          break;
        case 429:
          toast.error(getRateLimitMessage(error));
          break;
        default:
          toast.error('인증 코드 전송에 실패했습니다.');
      }
    },
  });

  const { mutate: checkEmailCode } = useCheckEmailCode({
    onSuccess: () => {
      setIsCodeVerified(true);
      toast.success('인증 코드가 확인되었습니다.');
    },
    onError: (error: unknown) => {
      setIsCodeVerified(false);
      switch (getApiErrorCode(error)) {
        case 400:
          toast.error('인증 코드가 일치하지 않습니다.');
          break;
        case 404:
          toast.error('인증 코드가 만료되었거나 존재하지 않습니다.');
          break;
        case 429:
          onVerifyRetryable?.();
          toast.error(getRateLimitMessage(error));
          break;
        default:
          onVerifyRetryable?.();
          toast.error('인증 코드 확인에 실패했습니다.');
      }
    },
  });

  const sendCode = useCallback(
    (email: string) => {
      sendEmailCode({ email });
    },
    [sendEmailCode],
  );

  const verifyCode = useCallback(
    (email: string, code: string) => {
      checkEmailCode({ email, code });
    },
    [checkEmailCode],
  );

  return {
    codeSent,
    isCodeVerified,
    remainingTime,
    isSendingCode,
    canResend: remainingTime === 0,
    sendCode,
    verifyCode,
  };
};
