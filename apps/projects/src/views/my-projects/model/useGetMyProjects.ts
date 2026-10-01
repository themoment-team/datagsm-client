import { get, meProjectQueryKeys, meProjectUrl } from '@repo/shared/api';
import type { MyProjectListResponse, ProjectRequestStatus } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

export const useGetMyProjects = (
  requestStatus?: ProjectRequestStatus,
  options?: Omit<UseQueryOptions<MyProjectListResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: meProjectQueryKeys.getMyProjects(requestStatus),
    queryFn: () => get<MyProjectListResponse>(meProjectUrl.getMyProjects(requestStatus)),
    staleTime: minutesToMs(1),
    gcTime: minutesToMs(5),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
