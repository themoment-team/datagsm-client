import { COOKIE_KEYS } from '@repo/shared/constants';
import { deleteCookie, getCookie, setCookie } from '@repo/shared/utils';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { oauthUrl } from '../api';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** true면 401 응답에도 토큰 refresh·리다이렉트를 건너뛴다 (공개 조회 등 인증 예외 요청). */
    skipAuthRefresh?: boolean;
  }
}

/**
 * OAuth 토큰 엔드포인트(/v1/oauth/token)는 공통 래핑({ status, code, message, data })에서
 * 의도적으로 제외돼 토큰 필드가 최상위로 온다. oauthAxiosInstance 인터셉터가 본문을 그대로
 * 반환하므로 이 타입이 곧 await 결과의 형태다. grant_type에 따라 refresh_token은 없을 수 있다.
 */
interface OAuthTokenRefreshResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string | null;
  scope?: string;
}

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

export const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const oauthAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OAUTH_BASE_URL,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    return Promise.reject(response.data);
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      skipAuthRefresh?: boolean;
    };

    // skipAuthRefresh 플래그가 있으면 토큰 갱신 건너뛰기 (로그인, 회원가입 등)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) throw new Error('No refresh token');

        const response = await oauthAxiosInstance.post<
          OAuthTokenRefreshResponse,
          OAuthTokenRefreshResponse
        >(oauthUrl.postOAuthTokenRefresh(), {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID,
        });

        // 인터셉터가 이미 본문을 반환하므로 response가 곧 토큰 객체다 (`.data`를 또 읽지 않는다).
        const { access_token: newAccessToken, refresh_token: newRefreshToken } = response;

        if (!newAccessToken) throw new Error('No new token returned');

        setCookie(COOKIE_KEYS.ACCESS_TOKEN, newAccessToken);
        // refresh_token은 grant_type에 따라 null일 수 있으므로, 새 값이 있을 때만 교체한다.
        if (newRefreshToken) {
          setCookie(COOKIE_KEYS.REFRESH_TOKEN, newRefreshToken);
        }

        refreshQueue.forEach((cb) => cb(newAccessToken));
        refreshQueue = [];

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
        deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);

        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

oauthAxiosInstance.interceptors.response.use(
  (response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    return Promise.reject(response.data);
  },
  (error: AxiosError) => Promise.reject(error),
);
