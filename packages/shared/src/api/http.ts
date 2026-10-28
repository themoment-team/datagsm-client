import { axiosInstance, oauthAxiosInstance } from '@repo/shared/lib';

// 인터셉터가 응답 본문을 반환하므로 R을 T로 지정한다. axios는 반환 타입을 "R이 내부 기본값 심볼이면 AxiosResponse,
// 아니면 R"인 조건부 타입으로 선언하는데, 제네릭 T에서는 이 조건이 풀리지 않아 반환 타입을 T로 명시하고 단언한다.
export const del = async <T>(...args: Parameters<typeof axiosInstance.delete>): Promise<T> =>
  (await axiosInstance.delete<T, T>(...args)) as T;

export const get = async <T>(...args: Parameters<typeof axiosInstance.get>): Promise<T> =>
  (await axiosInstance.get<T, T>(...args)) as T;

export const patch = async <T>(...args: Parameters<typeof axiosInstance.patch>): Promise<T> =>
  (await axiosInstance.patch<T, T>(...args)) as T;

export const post = async <T>(...args: Parameters<typeof axiosInstance.post>): Promise<T> =>
  (await axiosInstance.post<T, T>(...args)) as T;

export const put = async <T>(...args: Parameters<typeof axiosInstance.put>): Promise<T> =>
  (await axiosInstance.put<T, T>(...args)) as T;

export const oauthPost = async <T>(...args: Parameters<typeof oauthAxiosInstance.post>): Promise<T> =>
  (await oauthAxiosInstance.post<T, T>(...args)) as T;

export const oauthPut = async <T>(...args: Parameters<typeof oauthAxiosInstance.put>): Promise<T> =>
  (await oauthAxiosInstance.put<T, T>(...args)) as T;

export const oauthGet = async <T>(...args: Parameters<typeof oauthAxiosInstance.get>): Promise<T> =>
  (await oauthAxiosInstance.get<T, T>(...args)) as T;

export const oauthDel = async <T>(...args: Parameters<typeof oauthAxiosInstance.delete>): Promise<T> =>
  (await oauthAxiosInstance.delete<T, T>(...args)) as T;
