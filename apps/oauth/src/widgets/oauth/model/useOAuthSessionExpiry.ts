import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

// 서버가 알려 준 만료 시각보다 30초 일찍 만료로 본다.
// 요청이 오가는 시간이나 기기 시계 차이 때문에 만료 직전에 보낸 요청이 거절되지 않게 한다.
const BUFFER_TIME_MS = 30000;

/**
 * 인증 세션의 남은 시간을 초 단위로 세고, 다 되면 만료 상태로 바꾼다.
 * 백그라운드 탭에서는 타이머가 늦게 돌 수 있어 화면으로 돌아오면 바로 다시 계산한다.
 *
 * @param expiresAt 세션 조회 응답의 만료 시각(epoch ms). 받기 전에는 세지 않는다.
 */
export const useOAuthSessionExpiry = (expiresAt: number | undefined) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const hasShownExpiredToast = useRef(false);

  useEffect(() => {
    if (!expiresAt || isExpired) return;

    const updateRemainingTime = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - BUFFER_TIME_MS - Date.now()) / 1000));

      setRemainingTime(remaining);

      if (remaining > 0) return;

      setIsExpired(true);
      if (!hasShownExpiredToast.current) {
        hasShownExpiredToast.current = true;
        toast.error('인증 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRemainingTime();
      }
    };

    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 1000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [expiresAt, isExpired]);

  /** 남은 시간과 관계없이 만료시킨다. 서버가 먼저 만료를 알려 왔을 때 쓴다. */
  const expire = useCallback(() => setIsExpired(true), []);

  return { remainingTime, isExpired, expire };
};
