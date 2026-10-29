import axios, { AxiosError, AxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** true면 401 응답에도 토큰 refresh·리다이렉트를 건너뛴다 (공개 조회 등 인증 예외 요청). */
    skipAuthRefresh?: boolean;
  }
}

let isRefreshing = false;
let refreshQueue: { retry: () => void; fail: (error: unknown) => void }[] = [];

// 토큰은 httpOnly 쿠키라 여기서 읽지 않는다. `/api/*` 미들웨어가 쿠키를 Authorization 헤더로 옮겨 붙인다.
export const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const oauthAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OAUTH_BASE_URL,
  timeout: 10000,
});

/**
 * 이 앱의 토큰 쿠키를 지운다. httpOnly 쿠키는 브라우저에서 지울 수 없어 서버 라우트(`/api/logout`)에 맡긴다.
 * 실패하면 토큰이 그대로 남으므로 오류를 던진다. 호출하는 쪽은 로그아웃을 마친 것처럼 이동하지 않아야 한다.
 */
export const logoutLocally = async (): Promise<void> => {
  await axiosInstance.post('/logout', undefined, { skipAuthRefresh: true });
};

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
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            retry: () => resolve(axiosInstance(originalRequest)),
            fail: reject,
          });
        });
      }

      isRefreshing = true;
      try {
        // 서버 라우트가 httpOnly refresh token으로 갱신하고 새 토큰 쿠키를 심는다.
        // 실패하면 그 응답이 쿠키를 모두 지우므로 여기서는 이동만 한다.
        await axiosInstance.post('/refresh', undefined, { skipAuthRefresh: true });

        refreshQueue.forEach(({ retry }) => retry());
        refreshQueue = [];

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 대기 중이던 요청도 함께 실패시켜, 다음 갱신이 성공할 때 지난 요청이 다시 나가지 않게 한다.
        refreshQueue.forEach(({ fail }) => fail(refreshError));
        refreshQueue = [];

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
