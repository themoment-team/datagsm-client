import { get, publicProjectQueryKeys, publicProjectUrl } from '@repo/shared/api';
import type { PublicProjectResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

export const useGetPublicProject = (
  projectId: number,
  options?: Omit<UseQueryOptions<PublicProjectResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: publicProjectQueryKeys.getPublicProjectById(projectId),
    queryFn: () => get<PublicProjectResponse>(publicProjectUrl.getPublicProjectById(projectId)),
    staleTime: minutesToMs(1),
    gcTime: minutesToMs(5),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
