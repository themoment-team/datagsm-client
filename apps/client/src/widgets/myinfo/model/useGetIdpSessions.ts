import { oauthGet, oauthQueryKeys, oauthUrl } from '@repo/shared/api';
import { IdpSessionListResponse } from '@repo/shared/types';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const useGetIdpSessions = () =>
  useQuery<IdpSessionListResponse, AxiosError>({
    queryKey: oauthQueryKeys.getIdpSessions(),
    queryFn: () =>
      oauthGet<IdpSessionListResponse>(oauthUrl.getIdpSessions(), { withCredentials: true }),
  });
