import { axiosInstance, oauthAxiosInstance } from '@repo/shared/lib';

/**
 * 인터셉터가 응답 본문을 반환하므로 요청마다 R을 T로 지정하고, 반환 타입 단언은 이 한 곳에서만 한다.
 * axios는 반환 타입을 "R이 내부 기본값 심볼이면 AxiosResponse, 아니면 R"인 조건부 타입으로 선언하는데,
 * 제네릭 T에서는 이 조건이 풀리지 않아 선언 생성이 실패한다(TS2527).
 */
const unwrap = <T>(request: Promise<unknown>): Promise<T> => request as Promise<T>;

export const del = async <T>(...args: Parameters<typeof axiosInstance.delete>): Promise<T> =>
  unwrap<T>(axiosInstance.delete<T, T>(...args));

export const get = async <T>(...args: Parameters<typeof axiosInstance.get>): Promise<T> =>
  unwrap<T>(axiosInstance.get<T, T>(...args));

export const patch = async <T>(...args: Parameters<typeof axiosInstance.patch>): Promise<T> =>
  unwrap<T>(axiosInstance.patch<T, T>(...args));

export const post = async <T>(...args: Parameters<typeof axiosInstance.post>): Promise<T> =>
  unwrap<T>(axiosInstance.post<T, T>(...args));

export const put = async <T>(...args: Parameters<typeof axiosInstance.put>): Promise<T> =>
  unwrap<T>(axiosInstance.put<T, T>(...args));

export const oauthPost = async <T>(
  ...args: Parameters<typeof oauthAxiosInstance.post>
): Promise<T> => unwrap<T>(oauthAxiosInstance.post<T, T>(...args));

export const oauthPut = async <T>(...args: Parameters<typeof oauthAxiosInstance.put>): Promise<T> =>
  unwrap<T>(oauthAxiosInstance.put<T, T>(...args));

export const oauthGet = async <T>(...args: Parameters<typeof oauthAxiosInstance.get>): Promise<T> =>
  unwrap<T>(oauthAxiosInstance.get<T, T>(...args));

export const oauthDel = async <T>(
  ...args: Parameters<typeof oauthAxiosInstance.delete>
): Promise<T> => unwrap<T>(oauthAxiosInstance.delete<T, T>(...args));
