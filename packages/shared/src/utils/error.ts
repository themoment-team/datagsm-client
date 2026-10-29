import { AxiosError } from 'axios';

export const getApiErrorCode = (error: unknown): number | undefined => {
  if (error instanceof AxiosError) {
    return (error.response?.data as { code?: number })?.code;
  }
  return undefined;
};

/** 서버 오류 응답 본문의 message. 빈 문자열도 undefined로 돌려줘 `?? 기본 문구`로 대신할 수 있게 한다. */
export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message || undefined;
  }
  return undefined;
};

const RATE_LIMIT_FALLBACK_MESSAGE = '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';

/**
 * 요청 횟수 초과(429) 안내.
 * 서버 문구에 남은 대기 시간("N초 후에 다시 시도해주세요.")이 담겨 있어 그대로 쓰고, 없으면 기본 문구를 쓴다.
 */
export const getRateLimitMessage = (error: unknown): string =>
  getApiErrorMessage(error) ?? RATE_LIMIT_FALLBACK_MESSAGE;
