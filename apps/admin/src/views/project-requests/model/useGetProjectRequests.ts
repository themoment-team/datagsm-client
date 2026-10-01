import { get, projectRequestQueryKeys, projectRequestUrl } from '@repo/shared/api';
import type { ProjectRequestListResponse, ProjectRequestStatus } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

interface UseGetProjectRequestsParams {
  requestStatus?: ProjectRequestStatus;
  page?: number;
  size?: number;
}

export const useGetProjectRequests = (
  params: UseGetProjectRequestsParams,
  options?: Omit<UseQueryOptions<ProjectRequestListResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: projectRequestQueryKeys.getProjectRequests(params),
    queryFn: () => get<ProjectRequestListResponse>(projectRequestUrl.getProjectRequests(params)),
    staleTime: minutesToMs(1),
    gcTime: minutesToMs(5),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
