import { oauthGet, oauthQueryKeys, oauthUrl } from '@repo/shared/api';
import { IdpSessionListResponse } from '@repo/shared/types';
import { useQuery } from '@tanstack/react-query';

export const useGetIdpSessions = () =>
  useQuery({
    queryKey: oauthQueryKeys.getIdpSessions(),
    queryFn: () =>
      oauthGet<IdpSessionListResponse>(oauthUrl.getIdpSessions(), { withCredentials: true }),
  });
