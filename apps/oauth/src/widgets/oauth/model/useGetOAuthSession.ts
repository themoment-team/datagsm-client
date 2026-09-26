import { oauthGet, oauthQueryKeys, oauthUrl } from '@repo/shared/api';
import { OAuthSessionResponse } from '@repo/shared/types';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const STORAGE_KEY = 'oauth_session_timestamp';

export const useGetOAuthSession = (token: string | null) => {
  return useQuery<OAuthSessionResponse, AxiosError>({
    queryKey: oauthQueryKeys.getOAuthSession(token || ''),
    queryFn: async () => {
      if (!token) throw new Error('Token is required');

      // 1. 로컬 스토리지 확인
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          // 토큰이 일치하고 필요한 정보가 다 있다면 즉시 반환
          if (
            parsed.token === token &&
            parsed.serviceName &&
            parsed.expiresAt &&
            parsed.requestedScopes
          ) {
            return {
              data: {
                serviceName: parsed.serviceName,
                expiresAt: parsed.expiresAt,
                requestedScopes: parsed.requestedScopes,
              },
            } as OAuthSessionResponse;
          }
        } catch (e) {
          console.error('세션 캐시 파싱 실패:', e);
        }
      }

      // 2. 캐시가 없거나 토큰이 다르면 서버에서 받아옴
      return oauthGet<OAuthSessionResponse>(oauthUrl.getOAuthSession(token));
    },
    enabled: !!token,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
