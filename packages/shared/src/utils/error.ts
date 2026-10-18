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
