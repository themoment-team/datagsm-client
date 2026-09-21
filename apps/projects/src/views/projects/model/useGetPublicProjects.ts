import { get, publicProjectQueryKeys, publicProjectUrl } from '@repo/shared/api';
import type { PublicProjectListResponse, PublicProjectQueryParams } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

export const useGetPublicProjects = (
  params: PublicProjectQueryParams,
  options?: Omit<UseQueryOptions<PublicProjectListResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: publicProjectQueryKeys.getPublicProjects(params),
    queryFn: () =>
      get<PublicProjectListResponse>(publicProjectUrl.getPublicProjects(params), {
        skipAuthRefresh: true,
      }),
    staleTime: minutesToMs(1),
    gcTime: minutesToMs(5),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
