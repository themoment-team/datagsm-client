import type { ApiResponse, BaseApiResponse } from '@repo/shared/types';
import { HttpResponse } from 'msw';

/**
 * `axiosInstance`의 baseURL(`/api`)을 붙인 경로 패턴.
 * 호스트와 무관하게 매칭하도록 앞에 `*`를 붙인다.
 *
 * @example http.get(apiPath('/v1/students'), ...)
 */
export const apiPath = (path: string) => `*/api${path}`;

/** 서버의 성공 응답 형식(`{ status, code, message, data }`)으로 감싼다. */
export const apiSuccess = <T>(data: T, init?: { message?: string }) =>
  HttpResponse.json<ApiResponse<T>>({
    status: 'OK',
    code: 200,
    message: init?.message ?? 'OK',
    data,
  });

/** 서버의 실패 응답을 HTTP 상태 코드와 함께 돌려준다. */
export const apiError = (code: number, message: string, status = 'ERROR') =>
  HttpResponse.json<BaseApiResponse>({ status, code, message }, { status: code });
